# Accounts and sessions

## The shape

The account is created at the **first step of the application**, with a
password, and the session starts there. Profile and payment happen signed in.

```
step 1  name, mobile, email, password   -> POST /api/auth/register
                                           auth user + candidate row + session
                                           verification email sent, nothing waits for it
step 2  position, experience, city      -> held in the browser
step 3  payment                         -> POST /api/signup
                                           completes the profile on the session's row,
                                           opens checkout
        assessment                      -> requires payment_status = 'paid'
        report                          -> requires paid AND email_verified_at
```

## Why the email is not in the way

Blocking the funnel on a confirmation email was considered and rejected.

On Android a link opened from Gmail loads in Gmail's own in-app browser. The
session cookie is set there. The candidate then opens the site in Chrome and is
signed out, with nothing on screen explaining why. That failure is common, it is
invisible to us, and it is unrecoverable with magic links alone.

A password makes it recoverable from any browser, which is the real argument for
having one. And if the password works everywhere, there is no reason to make
anyone wait for the email before they can continue.

So the address is proved later, and the **report** is what waits for it. The
report is delivered to that address and carries the candidate's name, score and
rank. Sending it somewhere nobody proved is the actual harm; being unable to
start an assessment you have paid for is not a safety measure.

## Supabase dashboard settings this depends on

| Setting | Value | Why |
|---|---|---|
| Authentication → Sign In / Providers → **Confirm email** | **OFF** | With it on, `signUp` returns no session, the candidate is stranded at step 1, and this design silently becomes the one it replaced. |
| Authentication → URL Configuration → **Redirect URLs** | the deployed origin + `/auth/callback` | Otherwise Supabase drops every emailed link on the Site URL instead. |
| Authentication → **Password requirements** | 8 characters, leaked-password check on | The schema enforces 8 as well. The leaked-password check only exists in the dashboard. |
| Authentication → **SMTP Settings** | real SMTP, not the built-in sender | The built-in sender does **2 emails per hour for the whole project** and Supabase says it is not for production. Every registration now sends one. |

Confirmation being off means `auth.users.email_confirmed_at` is set at birth and
proves nothing. `candidates.email_verified_at` is the column that means
something: it is written in `/auth/callback` when someone follows a link that
was sent to that address.

## Roles

`getViewer()` resolves one of five, most privileged first.

| Role | Is |
|---|---|
| `staff` | a row in `staff_users` |
| `employer` | a row in `employer_users` |
| `candidate` | a row in `candidates` |
| `registered` | a session with none of the above |
| `anonymous` | no session |

`registered` exists because the alternative caused two production bugs. Reporting
a signed-in user as anonymous sends them to sign-in; sign-in sees no viewer and
shows the form; they sign in, hit the same guard, and come back. Every state a
session can be in needs a name and a destination, or it becomes a loop.

`homeFor` sends a candidate to where they actually stopped: profile, payment or
dashboard. Someone who follows the verification link four days later lands on
the step they left, not on a dashboard with nothing in it.

## The two questions the browser is not allowed to answer

Both need the service role, and both strand a candidate silently if guessed.

**Does this address already have an account?** Supabase will not say: `signUp`
on an existing address returns an obfuscated user and no error, so the endpoint
cannot be used to enumerate accounts. On our own signup form that protection is
a trap, so `/api/auth/register` answers it and the form sends them to sign in.
The same shape of silence locked four paying candidates out of this platform
once already.

**Is this phone number someone else's?** Candidates are unique on
`(phone_hash, cohort_id)`, and registration used to upsert on that key. A second
person entering the same number overwrote the first person's row, email
included. If the first had paid, they lost it. Registration now refuses.

## Abandoned registrations

An account opened at step 1 and left is a lead, not litter. `candidates`
carries `reminder_count`, `last_reminder_at` and `unsubscribed_at`, and the
`candidate_lifecycle` view labels each row `mql_registered`, `mql_profiled` or
`sql`.

`/api/cron/signup-reminders` runs daily at 09:00 UTC (`vercel.json`), guarded by
`CRON_SECRET`: without the guard the endpoint is a button anyone can press to
make us send mail, which is both a bill and a way to burn a sending reputation.

Three reminders, at 1, 3 and 10 days. The schedule counts from the last contact
rather than from registration, so a missed run does not fire two reminders the
next day. The count lives on the row, so a retried or overlapping run cannot
send a fourth, and it is only incremented when the mailer accepted the message:
a refused send is retried next run instead of quietly using one up.

They are about something the person started, not a newsletter, but they carry
`List-Unsubscribe` and `List-Unsubscribe-Post` and a working link either way.
`/api/unsubscribe` answers GET and POST without a session, because that is the
point of an unsubscribe link; the token is an HMAC of the candidate id, so a
link in an inbox cannot be edited into someone else's, and the only thing it
can set is `unsubscribed_at`.

Nothing deletes rows yet. That is deliberate: deletion is the one step here
that cannot be undone, and the retention rule should be a decision rather than
a default.

### Sending

`src/lib/email` is the same shape as the payment providers: an interface with a
no-op default. Unconfigured, it logs what it would have sent and the cron
reports `mailer: "noop"`, rather than failing the run or half-sending a batch.

SES over the signed HTTPS API, not the SDK, because this needs one call and the
SDK is large. Set `AWS_SES_REGION`, `AWS_SES_ACCESS_KEY_ID`,
`AWS_SES_SECRET_ACCESS_KEY` and `EMAIL_FROM`.

This is separate from the Supabase SMTP setting above. Supabase sends the auth
mail from its own templates; this sends everything else. Both need to be
configured, and both are unconfigured today.
