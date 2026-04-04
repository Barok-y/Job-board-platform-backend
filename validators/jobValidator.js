const Joi = require('joi');

const jobSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Job title is required',
            'string.min': 'Title should be at least 3 characters long'
        }),

    description: Joi.string()
        .min(10)
        .required(),

    location: Joi.string()
        .required(),

    salary: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Salary must be a positive number'
        }),

    company: Joi.string()
        .required(),

    requirements: Joi.array()
        .items(Joi.string())
        .min(1)
        .required()
});

const validateJob = (req, res, next) => {
    const { error } = jobSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return res.status(400).json({ error: errorMessage });
    }
    
    next();
};

module.exports = { validateJob };