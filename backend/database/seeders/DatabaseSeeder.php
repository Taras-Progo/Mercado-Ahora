<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ProducerProfile;
use App\Models\ProducerSocialLink;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $categories = [
            ['Alimentos naturales', 'Miel, mermeladas, conservas, frutos secos, granos'],
            ['Huerta y productos frescos', 'Frutas, verduras, huevos, plantas aromáticas'],
            ['Bebidas naturales', 'Tés, infusiones, jugos naturales'],
            ['Cosmética natural', 'Jabones, cremas, aceites esenciales'],
            ['Bienestar y salud natural', 'Productos herbales, suplementos naturales'],
            ['Hogar sostenible', 'Productos reutilizables, limpieza ecológica'],
            ['Artesanías y productos regionales', 'Productos hechos a mano, madera, cerámica, textiles'],
            ['Mascotas naturales', 'Alimentos y accesorios naturales para mascotas'],
        ];

        foreach ($categories as $index => [$name, $description]) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => $description,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ],
            );
        }

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@mercadoahora.test'],
            [
                'name' => 'Admin Mercado Ahora',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
            ],
        );

        $seller = User::query()->updateOrCreate(
            ['email' => 'seller@mercadoahora.test'],
            [
                'name' => 'Productor Demo',
                'password' => Hash::make('password'),
                'role' => 'seller',
                'status' => 'active',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'buyer@mercadoahora.test'],
            [
                'name' => 'Comprador Demo',
                'password' => Hash::make('password'),
                'role' => 'buyer',
                'status' => 'active',
            ],
        );

        $profile = ProducerProfile::query()->updateOrCreate(
            ['user_id' => $seller->id],
            [
                'business_name' => 'Finca Raíces Verdes',
                'slug' => 'finca-raices-verdes',
                'province' => 'Córdoba',
                'city' => 'Alta Gracia',
                'description' => 'Producción familiar de alimentos naturales y productos regionales.',
                'production_practices' => 'Producción local, bajo uso de químicos y empaque reciclable.',
                'production_origin' => 'produccion_propia',
                'product_types' => 'Miel, infusiones, cosmética natural',
                'production_method' => 'natural_artesanal',
                'production_since' => '2018',
                'story' => 'Emprendimiento familiar enfocado en productos naturales, regionales y procesos transparentes.',
                'digital_presence_notes' => 'Cuenta con presencia local y canales digitales para validar trayectoria.',
                'status' => 'active',
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'approval_notes' => 'Productor demo aprobado para validar el flujo de confianza del MVP.',
            ],
        );

        ProducerSocialLink::query()->updateOrCreate(
            ['producer_profile_id' => $profile->id, 'platform' => 'instagram'],
            ['url' => 'https://instagram.com/finca_raices_verdes', 'is_visible' => true],
        );

        ProducerSocialLink::query()->updateOrCreate(
            ['producer_profile_id' => $profile->id, 'platform' => 'whatsapp_business'],
            ['url' => 'https://wa.me/5493510000000', 'is_visible' => true],
        );

        $sampleProducts = [
            [
                'name' => 'Miel natural de monte',
                'category' => 'alimentos-naturales',
                'price_cents' => 420000,
                'stock' => 24,
                'unit' => 'frasco',
                'ecoscore_points' => 90,
                'production_type' => 'natural',
                'delivery_type' => 'local',
            ],
            [
                'name' => 'Mix de hierbas para infusión',
                'category' => 'bebidas-naturales',
                'price_cents' => 280000,
                'stock' => 40,
                'unit' => 'paquete',
                'ecoscore_points' => 78,
                'production_type' => 'regional',
                'delivery_type' => 'local',
            ],
            [
                'name' => 'Jabón artesanal de caléndula',
                'category' => 'cosmetica-natural',
                'price_cents' => 190000,
                'stock' => 32,
                'unit' => 'unidad',
                'ecoscore_points' => 84,
                'production_type' => 'artesanal',
                'delivery_type' => 'home_delivery',
            ],
        ];

        foreach ($sampleProducts as $item) {
            $category = Category::query()->where('slug', $item['category'])->firstOrFail();

            Product::query()->updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'producer_profile_id' => $profile->id,
                    'category_id' => $category->id,
                    'name' => $item['name'],
                    'description' => 'Producto demo para validar el flujo comercial del MVP.',
                    'price_cents' => $item['price_cents'],
                    'currency' => 'ARS',
                    'stock' => $item['stock'],
                    'unit' => $item['unit'],
                    'province' => 'Córdoba',
                    'city' => 'Alta Gracia',
                    'production_type' => $item['production_type'],
                    'delivery_type' => $item['delivery_type'],
                    'ecoscore_points' => $item['ecoscore_points'],
                    'ecoscore_notes' => 'Evaluación inicial por reglas simples del MVP.',
                    'ecoscore_status' => 'manual_reviewed',
                    'ecoscore_validated_by' => $admin->id,
                    'ecoscore_validated_at' => now(),
                    'ecoscore_validation_notes' => 'Validación demo por revisión manual de criterios declarados.',
                    'status' => 'active',
                ],
            );
        }

        $admin->cart()->firstOrCreate();
        $seller->cart()->firstOrCreate();

        User::query()->where('email', 'buyer@mercadoahora.test')->first()?->cart()->firstOrCreate();
    }
}
