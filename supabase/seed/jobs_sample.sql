-- ============================================================================
-- Sample job postings - OPTIONAL, run by hand after 0014.
--
-- Every row is inserted as a DRAFT. They exist so the console is not empty on
-- day one and so a recruiter can see what a complete posting looks like.
-- Publish one only after it has been matched to a real vacancy with a real
-- employer: a vacancy that does not exist, shown to a candidate deciding
-- whether to move country, is the kind of thing this platform exists to stamp out.
-- ============================================================================

insert into job_postings (
  slug, title, position_slug, area, employer_display, city, region, country,
  employment_type, contract_months, openings, salary_min_eur, salary_max_eur, salary_period,
  housing, meals_included, visa_sponsored, relocation_support, min_experience_years, min_english,
  languages, summary, description, responsibilities, requirements, benefits, screening_questions,
  hero_image_url, status, featured
) values
(
  'line-cook-algarve', 'Line cook', 'chef', 'food-beverage', 'Four-star resort hotel', 'Albufeira', 'Algarve', 'PT',
  'full_time', 24, 6, 1050, 1250, 'month', 'provided', true, true, true, 2, 'A2',
  array['English'],
  'Hot and cold line in a resort kitchen serving 600 covers a day in season.',
  'You will work a hot or cold station in a resort hotel kitchen led by an executive chef with an international brigade. The hotel runs a buffet restaurant and two à la carte outlets.',
  array['Prepare and cook dishes to the standard recipe on your station', 'Keep HACCP records for your station', 'Receive and rotate stock', 'Clean down your station at the end of every service'],
  array['Two years in a professional kitchen', 'Food hygiene certificate, or willing to obtain one in the first month', 'Basic English to follow recipes and service calls'],
  array['Shared staff housing next to the hotel', 'Two meals per shift', '22 days paid holiday a year', 'Portuguese lessons in the first six months'],
  '[{"id":"haccp","label":"Do you hold a food hygiene or HACCP certificate?","type":"yesno","required":true},{"id":"cuisine","label":"Which cuisines have you cooked professionally?","type":"text","required":false}]'::jsonb,
  '/positions/chef-840.jpg', 'draft', true
),
(
  'housekeeping-attendant-lisbon', 'Housekeeping attendant', 'cleaner', 'cleaning', 'Boutique hotel group', 'Lisbon', 'Lisboa', 'PT',
  'full_time', 12, 10, 920, 1000, 'month', 'assisted', true, true, true, 1, 'A2',
  array['English'],
  'Room attendants for three boutique hotels in central Lisbon.',
  'Clean and prepare guest rooms to the group''s checklist across three boutique properties in Baixa and Chiado. Shifts are morning-led with weekend rotation.',
  array['Service 12 to 14 rooms per shift to checklist', 'Report maintenance issues through the housekeeping app', 'Handle guest property and lost items correctly'],
  array['One year in hotel housekeeping or commercial cleaning', 'Comfortable with physical work and stairs', 'Basic English'],
  array['Help finding a room to rent, first month deposit advanced', 'Meal on shift', 'Uniform provided'],
  '[]'::jsonb,
  '/positions/cleaner-840.jpg', 'draft', false
),
(
  'electrician-porto', 'Electrician (construction)', 'electrician', 'trades-logistics', 'Building contractor', 'Porto', 'Norte', 'PT',
  'full_time', 24, 4, 1300, 1600, 'month', 'assisted', false, true, true, 3, 'A2',
  array['English'],
  'First-fix and second-fix electrical work on residential new builds.',
  'Join a site team installing low-voltage electrical systems in apartment buildings. European (IEC) standards apply; the contractor provides a two-week induction on Portuguese regulations.',
  array['Install conduit, cabling, distribution boards and fittings', 'Read and work from electrical drawings', 'Test and document circuits'],
  array['Three years as an electrician', 'ITI or diploma in electrical trade', 'Able to read drawings'],
  array['Tools and PPE provided', 'Transport to site', 'Paid induction on EU standards'],
  '[{"id":"iti","label":"Do you hold an ITI or diploma in electrical work?","type":"yesno","required":true}]'::jsonb,
  '/positions/electrician-840.jpg', 'draft', true
),
(
  'delivery-driver-lisbon', 'Delivery driver', 'driver', 'trades-logistics', 'Logistics company', 'Lisbon', 'Lisboa', 'PT',
  'full_time', 12, 8, 1000, 1150, 'month', 'assisted', false, true, true, 2, 'A2',
  array['English'],
  'Van delivery routes around Greater Lisbon for a parcel network.',
  'Drive a light van on planned delivery routes. An Indian licence must be exchanged for a Portuguese one; the company supports the exchange process.',
  array['Load and deliver 80 to 120 parcels a day', 'Use the handheld scanner and route app', 'Daily vehicle checks'],
  array['Two years driving professionally', 'Valid Indian driving licence (light motor vehicle)', 'Clean driving record'],
  array['Licence exchange support', 'Company van and fuel card', 'Monthly performance bonus'],
  '[{"id":"licence","label":"How many years have you held your driving licence?","type":"text","required":true}]'::jsonb,
  '/positions/driver-840.jpg', 'draft', false
)
on conflict (slug) do nothing;
