import Joi from 'joi';

const jobSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    location: Joi.string().required(),
    salary: Joi.number().positive().required(),
    company: Joi.string().required(),
    requirements: Joi.array().items(Joi.string()).min(1).required()
});

export const validateJob = (req, res, next) => {
    const { error } = jobSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return res.status(400).json({ error: errorMessage });
    }
    next();
};