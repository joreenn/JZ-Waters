<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List all users with optional role filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->withCount('orders')->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($users),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    /**
     * Show a specific user.
     */
    public function show(User $user): JsonResponse
    {
        $user->loadCount('orders');

        return response()->json([
            'success' => true,
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * Create a new user (staff accounts).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:admin,refiller,delivery,customer',
            'phone'    => 'nullable|string|max:20',
            'address'  => 'nullable|string|max:500',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'phone'    => $request->phone,
            'address'  => $request->address,
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data'    => new UserResource($user),
        ], 201);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name'    => 'sometimes|string|max:255',
            'email'   => 'sometimes|email|unique:users,email,' . $user->id,
            'role'    => 'sometimes|in:admin,refiller,delivery,customer',
            'phone'   => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $user->update($request->only(['name', 'email', 'role', 'phone', 'address']));

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data'    => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Soft-delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.',
        ]);
    }
}
