import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientCapacityException extends HttpException {
  constructor(remaining: number, requested: number) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        error: 'InsufficientCapacity',
        message: `Only ${remaining} spots are currently available.`,
        remaining,
        requested,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class DuplicateRegistrationException extends ConflictException {
  constructor() {
    super({
      statusCode: HttpStatus.CONFLICT,
      error: 'DuplicateRegistration',
      message: 'You already have an active registration for this event',
    });
  }
}
