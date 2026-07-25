import { Request, Response } from "express";

export const welcome = async (req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        message: "Welcome to the Merapihost API",
        status: 200,
    });
}