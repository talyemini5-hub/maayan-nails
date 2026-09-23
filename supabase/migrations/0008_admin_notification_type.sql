-- Adds a notification_type value for the internal "new booking" alert email
-- sent to the business owner, separate from the customer-facing types.
alter type notification_type add value if not exists 'admin_new_booking';
