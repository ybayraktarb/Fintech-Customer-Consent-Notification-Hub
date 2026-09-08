import { Request, Response, NextFunction } from 'express';
import { WallService } from '../services/wall.service';
import { NotificationRequestDTO } from '../dtos/notification.dto';
import { PROCESS_CODES, PROCESS_MESSAGES } from '../constants/processCodes';
import { AppError } from '../middlewares/errorHandler.middleware';

export class WallController {
  private readonly wallService: WallService;

  constructor(wallService: WallService = new WallService()) {
    this.wallService = wallService;
  }

  public processNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as NotificationRequestDTO;

      if (!dto || !dto.musteriNo) {
        throw new AppError(
          PROCESS_MESSAGES[PROCESS_CODES.ERR_VALIDATION_FAILED],
          400,
          PROCESS_CODES.ERR_VALIDATION_FAILED
        );
      }

      const correlationId =
        req.correlationId ||
        (req.headers['x-correlation-id'] as string) ||
        (req.headers['x-request-id'] as string);

      res.setHeader('X-Correlation-ID', correlationId);

      const result = await this.wallService.processNotification(dto, correlationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
