import { getConnection } from '@/utils/connection';
import { Service } from '@/utils/entities/service';
import { Exception } from '@/utils/exception';
import { NextFunction, Request, Response } from 'express';

export async function serviceMiddleware(req: Request, res: Response, next: NextFunction) {

    const serviceId = req.params.serviceId;
    if (!serviceId || typeof serviceId !== 'string') {
        throw new Exception({
            message: 'Invalid serviceId in request params',
            status: 400,
            type: "INVALID_SERVICE_ID"
        });
    }
    
    const db = await getConnection();
    const serviceRepository = db.getRepository(Service);
    const service = await serviceRepository.findOne({
        where: {
            id: serviceId,
        },
    });

    if (!service) {
        throw new Exception({
            message: 'Service not found',
            status: 404,
            type: "SERVICE_NOT_FOUND"
        });
    }

    req.service = service;
    next();
}