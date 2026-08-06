<?php

namespace App\Exceptions;

use App\Traits\ApiResponse;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    use ApiResponse;

    public function render($request, Throwable $e)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            if ($e instanceof ValidationException) {
                return $this->validationError($e->errors(), $e->getMessage());
            }
            if ($e instanceof NotFoundHttpException) {
                return $this->notFound('Resource not found');
            }
            if ($e instanceof AccessDeniedHttpException) {
                return $this->forbidden();
            }

            $code = $this->isHttpException($e) ? $e->getStatusCode() : 500;
            $msg = $code === 500 ? 'Internal Server Error' : $e->getMessage();

            return $this->error($msg, $code);
        }

        return parent::render($request, $e);
    }
}
