<?php

namespace Database\Seeders;

use App\Models\Zone;
use Illuminate\Database\Seeder;

class ZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = [
            ['name' => 'Zone A – Nearby',   'delivery_fee' => 30.00, 'is_active' => true],
            ['name' => 'Zone B – Midrange',  'delivery_fee' => 50.00, 'is_active' => true],
            ['name' => 'Zone C – Far',       'delivery_fee' => 75.00, 'is_active' => true],
            ['name' => 'Zone D – Extended',  'delivery_fee' => 100.00, 'is_active' => true],
        ];

        foreach ($zones as $zone) {
            Zone::firstOrCreate(['name' => $zone['name']], $zone);
        }
    }
}
