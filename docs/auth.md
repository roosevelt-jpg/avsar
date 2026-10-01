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

Reminders are capped at three and the count lives on the row, not in a job, so a
retried job cannot send a fourth. They are about something the person started,
not a newsletter, but they still carry an unsubscribe, and the row is deleted
once the reminders are spent and nothing has happened.
