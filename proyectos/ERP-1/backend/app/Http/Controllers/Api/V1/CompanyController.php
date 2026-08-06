<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    use ApiResponse;

    public function show(): JsonResponse
    {
        $company = auth()->user()->company;
        return $this->success($company);
    }

    public function update(Request $request): JsonResponse
    {
        $company = auth()->user()->company;

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'tax_id' => 'sometimes|string|max:50',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'currency_code' => 'sometimes|string|max:3',
            'timezone' => 'sometimes|string|max:50',
            'config' => 'sometimes|json',
        ]);

        $company->update($request->all());

        return $this->success($company->fresh(), 'Empresa actualizada');
    }
}
