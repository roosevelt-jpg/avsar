# Authentication

## One entry point, three audiences

Everyone signs in at `/[locale]/signin`. There is no separate staff login;
`/admin/signin` only redirects, so old bookmarks still work.

| | Candidate | Employer | Staff |
|---|---|---|---|
| Method | One-time code | Password | Password |
| Authorisation | `candidates` row linked by `auth_user_id` | row in `employer_users` | row in `staff_users` |
| Lands on | `/[locale]/dashboard` | `/admin` | `/admin` |
| Helper | `requireCandidate()` | `requireStaffOrEmployer()` | `requireStaff()` |

Two mechanisms, not three, and both live on the same page. Candidates registered
once and come back weeks later, where a password is a support burden and a code
to the address they already gave is not. Employers and staff are a small known
set on their own devices, where a password manager beats a code round trip.

**Both mechanisms are on the page at once, rather than the page asking for an
email and then choosing.** Choosing would mean revealing whether an address
belongs to staff before anyone has proved who they are, which turns sign-in into
a directory of who works here.

### Where you land is decided server side

`/auth/route` reads the session and redirects. The form never states a
destination, so nothing a browser sends can talk its way into a surface the
viewer is not entitled to. An explicit `next` is honoured only when it is
same-origin *and* the role allows it; otherwise the viewer lands at their own
home.

`getViewer()` checks staff, then employer, then candidate. Most-privileged
first, so an account that is both in a test environment lands consistently
rather than by whichever query happened to run first.

### Employers share the talent pool, not the AI score

`/admin` is open to staff and to vetted employers, but the CV review column and
the cohort and placement tabs render only for staff. Handing an employer a raw
model score as if it measured the person would be indefensible, and RLS backs
this up: no policy grants an employer access to `cv_assessments`.

## Why email and not WhatsApp or SMS

The right channel for this audience is WhatsApp or SMS on the mobile number they
registered, because it is the number they actually check and verifying it is
useful in itself. It is not built yet because sending SMS to Indian numbers needs
DLT registration with TRAI and a contracted provider, and neither exists.

What changes when the provider is in place:

1. Configure the SMS provider in Supabase → Authentication → Providers → Phone.
2. In `SignInForm.tsx`, swap `signInWithOtp({ email })` for
   `signInWithOtp({ phone })` and `verifyOtp({ type: 'email' })` for
   `type: 'sms'`. The rest of the component does not change.
3. Replace the email trigger in `0003_auth.sql` with one matching on `phone`.
   `candidates.phone` is already stored as `+91…`, which is the format Supabase
   expects.

Email stays as the fallback either way: some candidates change number between
registering and being selected, and an account that can only be reached on a
dead SIM is an account nobody can recover.

## How a candidate gets linked to their account

The candidate row is created at sign-up, before any auth account exists, because
payment comes first. When they later ask for a code, the trigger
`link_candidate_to_auth_user` on `auth.users` attaches the new user id to the
candidate row with the matching email, case-insensitively.

Matching on email is sound here specifically because the one-time code proves
they control that address. It would not be sound as a general identity claim.

A candidate who signs in with a different address than they registered with gets
no link and lands with no candidate record. That is correct behaviour, not a bug.

## Things that are deliberate

**`shouldCreateUser: false`.** An address that never registered and paid must not
be able to conjure an account by asking for a code.

**Sign-in never says whether an address exists.** Same message either way, on both
forms. Otherwise sign-in becomes a way to test who has registered.

**Sign-out is POST only.** A GET would let any page log the user out with an
`<img>` tag, and link prefetchers would do it by accident.

**The session refresh lives in `src/proxy.ts`.** Two things about that path are
load-bearing: with a `src` directory, Next silently ignores this file at the
project root rather than reporting an error, and Next 16 renamed the convention
from `middleware` to `proxy`. Get either wrong and auth appears to work until a
token expires.

**The `next` parameter is same-origin only.** An open redirect on a sign-in page
is how a credential-phishing link gets to look legitimate.

**Staff are a table, not a flag.** A role in user metadata is editable by the user
it belongs to, and these are the people who decide whether a candidate advances.

**The assessment deadline is set by the database.** `start_assessment_attempt()`
is `security definer` and reads the duration from a constant, so the candidate
never supplies their own `expires_at`. The previous `attempts_self_all` policy
allowed exactly that; `0003` removed it.

## Setting up a staff account

Create the user in Supabase → Authentication → Users → Add user, then:

```sql
insert into staff_users (auth_user_id, email, role)
select id, email from auth.users where email = 'you@example.com'
on conflict (auth_user_id) do update set role = 'admin';
```

Having an account is not enough. Without this row, `/admin` and the CV review
redirect to sign-in, which is the intended behaviour: staff access is granted
explicitly, never as a side effect of having signed up.

## Not built yet

- Account recovery for a candidate who has lost access to their email.
- Rate limiting on code requests beyond what Supabase applies by default.
- Employer sign-in. `employer_users` and its policies exist from `0001`, but
  there is no form; employers currently reach the talent pool through staff.
- Session revocation when a candidate withdraws consent.
