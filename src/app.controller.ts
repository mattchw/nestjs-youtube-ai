import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getStatus(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({ message: "status check - OK" });
  }
}
