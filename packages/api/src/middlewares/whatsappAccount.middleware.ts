import { getConnection } from '@/connection';
import { WhatsappAccount } from '@/entities/whatsapp-account';
import { Exception } from '@/utils/exception';
import { NextFunction, Request, Response } from 'express';

export async function whatsappAccountMiddleware(req: Request, res: Response, next: NextFunction) {

    /**
     * Grab the accountId from the request params and validate it.
     */
    const accountId = req.params.accountId;

    /**
     * Ensure that the service is a WhatsApp service before proceeding.
     */
    if (!req.service || req.service.type !== 'whatsapp') {
        throw new Exception({
            message: 'Service is not a WhatsApp service',
            status: 400,
            type: "INVALID_SERVICE_TYPE"
        });
    }

    if (!req.service.metadata || !req.service.metadata.wabaId) {
        throw new Exception({
            message: 'WhatsApp Business Account ID (wabaId) is missing in service metadata',
            status: 400,
            type: "MISSING_WABA_ID"
        });
    }

    if (!req.service.metadata || !req.service.metadata.whatsappAccessToken) {
        throw new Exception({
            message: 'WhatsApp Access Token is missing in service metadata',
            status: 400,
            type: "MISSING_WHATSAPP_ACCESS_TOKEN"
        });
    }

    /**
     * Validate the accountId and fetch the corresponding WhatsApp account from the database.
     */
    if (!accountId || typeof accountId !== 'string') {
        throw new Exception({
            message: 'Invalid accountId in request params',
            status: 400,
            type: "INVALID_ACCOUNT_ID"
        });
    }

    /**
     * Fetch the WhatsApp account from the database using the provided accountId.
     */
    const db = await getConnection();
    const accountRepository = db.getRepository(WhatsappAccount);
    const account = await accountRepository.findOne({
        where: {
            id: accountId
        },
    });

    if (!account) {
        throw new Exception({
            message: 'WhatsApp account not found',
            status: 404,
            type: "ACCOUNT_NOT_FOUND"
        });
    }
    req.whatsappAccount = account;
    next();
}