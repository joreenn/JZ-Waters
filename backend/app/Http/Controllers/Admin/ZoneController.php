<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ZoneResource;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneController extends Controller
{
    /**
     * List all delivery zones.
     */
    public function index(): JsonResponse
    {
        $zones = Zone::all();

        return response()->json([
            'success' => true,
            'data'    => ZoneResource::collection($zones),
        ]);
    }

    /**
     * Create a new zone.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'         => 'required|string|max:255|unique:zones',
            'delivery_fee' => 'required|numeric|min:0',
        ]);

        $zone = Zone::create($request->only(['name', 'delivery_fee']));

        return response()->json([
            'success' => true,
            'message' => 'Zone created successfully.',
            'data'    => new ZoneResource($zone),
        ], 201);
    }

    /**
     * Update a zone.
     */
    public function update(Request $request, Zone $zone): JsonResponse
    {
        $request->validate([
            'name'         => 'sometimes|string|max:255|unique:zones,name,' . $zone->id,
            'delivery_fee' => 'sometimes|numeric|min:0',
            'is_active'    => 'sometimes|boolean',
        ]);

        $zone->update($request->only(['name', 'delivery_fee', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Zone updated successfully.',
            'data'    => new ZoneResource($zone->fresh()),
        ]);
    }

    /**
     * Delete a zone.
     */
    public function destroy(Zone $zone): JsonResponse
    {
        if ($zone->orders()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete zone with existing orders.',
            ], 422);
        }

        $zone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Zone deleted successfully.',
        ]);
    }
}
