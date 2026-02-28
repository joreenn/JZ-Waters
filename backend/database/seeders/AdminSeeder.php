<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@jzwaters.com'],
            [
                'name'     => 'JZ Waters Admin',
                'password' => Hash::make('password'),
                'phone'    => '09171234567',
                'address'  => 'JZ Waters Main Office',
                'role'     => 'admin',
            ]
        );
        $admin->assignRole('admin');

        // Demo refiller
        $refiller = User::firstOrCreate(
            ['email' => 'refiller@jzwaters.com'],
            [
                'name'     => 'Demo Refiller',
                'password' => Hash::make('password'),
                'phone'    => '09171234568',
                'address'  => 'JZ Waters Station',
                'role'     => 'refiller',
            ]
        );
        $refiller->assignRole('refiller');

        // Demo delivery
        $delivery = User::firstOrCreate(
            ['email' => 'delivery@jzwaters.com'],
            [
                'name'     => 'Demo Rider',
                'password' => Hash::make('password'),
                'phone'    => '09171234569',
                'address'  => 'JZ Waters Station',
                'role'     => 'delivery',
            ]
        );
        $delivery->assignRole('delivery');

        // Demo customer
        $customer = User::firstOrCreate(
            ['email' => 'customer@jzwaters.com'],
            [
                'name'           => 'Demo Customer',
                'password'       => Hash::make('password'),
                'phone'          => '09171234570',
                'address'        => '123 Sample Street, Brgy. Test',
                'role'           => 'customer',
                'points_balance' => 25,
            ]
        );
        $customer->assignRole('customer');
    }
}
