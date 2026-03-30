const Joi = require("joi");
const { AppError } = require("./errorHandler");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    return next(new AppError(message, 400));
  }
  next();
};

const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(60).trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid("job_seeker", "employer").default("job_seeker"),
  }),
  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),
  createJob: Joi.object({
    title: Joi.string().min(3).max(100).trim().required(),
    description: Joi.string().min(20).max(5000).trim().required(),
    location: Joi.string().min(2).max(100).trim().required(),
    salary: Joi.object({
      min: Joi.number().min(0).required(),
      max: Joi.number().min(0).required(),
      currency: Joi.string().length(3).uppercase().default("USD"),
    }).required(),
    type: Joi.string().valid("full-time", "part-time", "contract", "internship").required(),
    skills: Joi.array().items(Joi.string().trim()).max(20),
  }),
  updateJob: Joi.object({
    title: Joi.string().min(3).max(100).trim(),
    description: Joi.string().min(20).max(5000).trim(),
    location: Joi.string().min(2).max(100).trim(),
    salary: Joi.object({ min: Joi.number().min(0), max: Joi.number().min(0), currency: Joi.string().length(3).uppercase() }),
    type: Joi.string().valid("full-time", "part-time", "contract", "internship"),
    skills: Joi.array().items(Joi.string().trim()).max(20),
    isActive: Joi.boolean(),
  }).min(1),
  createApplication: Joi.object({
    jobId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    cvUrl: Joi.string().uri().required(),
    coverLetter: Joi.string().max(2000).trim(),
  }),
  updateApplicationStatus: Joi.object({
    status: Joi.string().valid("pending", "accepted", "rejected").required(),
  }),
};

module.exports = { validate, schemas };