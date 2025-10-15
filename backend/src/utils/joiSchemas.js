import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
  provider_id: Joi.string().required(),
  appointment_type_id: Joi.string().required(),
  start_time: Joi.string().isoDate().required(),
  reason: Joi.string().allow('', null),
  insurance_info: Joi.object().unknown(true).allow(null),
  patient: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    date_of_birth: Joi.string().isoDate().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.object().unknown(true).optional()
  }).required()
});
