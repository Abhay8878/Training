import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data: T) => {
        const statusCode = response.statusCode || HttpStatus.OK;
        const result: any = data;

        return {
          success: true,
          status: statusCode,
          message: result?.message ?? 'Request successful',
          data: result?.data ?? data,
          meta: result?.meta,
        };
      }),
    );
  }
}
