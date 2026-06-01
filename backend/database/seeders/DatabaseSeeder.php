<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProducerProfile;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        $admin = User::create([
            'name' => 'Admin Mercado Ahora',
            'email' => 'admin@mercadoahora.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Categories
        $categories = [
            ['name' => 'Alimentos naturales', 'slug' => 'alimentos-naturales', 'description' => 'Miel, mermeladas, conservas, frutos secos, granos', 'sort_order' => 1],
            ['name' => 'Huerta y productos frescos', 'slug' => 'huerta-y-productos-frescos', 'description' => 'Frutas, verduras, huevos, plantas aromáticas', 'sort_order' => 2],
            ['name' => 'Bebidas naturales', 'slug' => 'bebidas-naturales', 'description' => 'Tés, infusiones, jugos naturales', 'sort_order' => 3],
            ['name' => 'Cosmética natural', 'slug' => 'cosmetica-natural', 'description' => 'Jabones, cremas, aceites esenciales', 'sort_order' => 4],
            ['name' => 'Bienestar y salud natural', 'slug' => 'bienestar-y-salud-natural', 'description' => 'Productos herbales, suplementos naturales', 'sort_order' => 5],
            ['name' => 'Hogar sostenible', 'slug' => 'hogar-sostenible', 'description' => 'Productos reutilizables, limpieza ecológica', 'sort_order' => 6],
            ['name' => 'Artesanías y productos regionales', 'slug' => 'artesanias-y-productos-regionales', 'description' => 'Madera, cerámica, textiles', 'sort_order' => 7],
            ['name' => 'Mascotas naturales', 'slug' => 'mascotas-naturales', 'description' => 'Alimentos y accesorios naturales', 'sort_order' => 8],
        ];

        $catModels = [];
        foreach ($categories as $cat) {
            $catModels[$cat['slug']] = Category::create($cat);
        }

        // Seller profiles
        $producers = [
            [
                'user' => ['name' => 'Verde Amanecer', 'email' => 'verde@amanecer.com'],
                'profile' => ['business_name' => 'Verde Amanecer', 'slug' => 'verde-amanecer', 'province' => 'San Luis', 'city' => 'Villa de Merlo', 'description' => 'Productora de cosmética natural elaborada con ingredientes orgánicos de la sierra. Cada producto es hecho a mano con plantas autóctonas y aceites esenciales puros.', 'production_practices' => 'Orgánico, sin químicos sintéticos, libre de crueldad animal', 'production_origin' => 'Sierra de los Comechingones', 'product_types' => 'Cosméticos naturales', 'production_method' => 'artesanal', 'story' => 'Comenzamos hace 8 años con un pequeño huerto de lavanda y caléndula. Hoy producimos más de 20 productos diferentes.'],
            ],
            [
                'user' => ['name' => 'La Colmena Natural', 'email' => 'colmena@natural.com'],
                'profile' => ['business_name' => 'La Colmena Natural', 'slug' => 'la-colmena-natural', 'province' => 'Córdoba', 'city' => 'Alta Gracia', 'description' => 'Apicultores desde hace tres generaciones. Producimos miel pura de monte, polen, propóleo y derivados de la colmena con prácticas tradicionales y sustentables.', 'production_practices' => 'Apicultura sustentable, sin antibióticos, cosecha responsable', 'production_origin' => 'Sierras de Córdoba', 'product_types' => 'Miel y derivados', 'production_method' => 'natural', 'story' => 'Mi abuelo empezó con 5 colmenas en 1965. Hoy cuidamos más de 200 colmenas en las sierras cordobesas.'],
            ],
            [
                'user' => ['name' => 'Madera Viva', 'email' => 'madera@viva.com'],
                'profile' => ['business_name' => 'Madera Viva', 'slug' => 'madera-viva', 'province' => 'Córdoba', 'city' => 'Villa General Belgrano', 'description' => 'Carpintería artesanal con madera recuperada de bosques certificados. Cada pieza es única, creada con técnicas tradicionales y acabados naturales.', 'production_practices' => 'Madera de bosque certificado FSC, acabados con aceites naturales', 'production_origin' => 'Valle de Calamuchita', 'product_types' => 'Carpintería artesanal', 'production_method' => 'artesanal', 'story' => 'Trabajo la madera desde los 15 años. Cada pieza que creo cuenta una historia de la tierra y el árbol que la originó.'],
            ],
            [
                'user' => ['name' => 'Tierra Adentro', 'email' => 'tierra@adentro.com'],
                'profile' => ['business_name' => 'Tierra Adentro', 'slug' => 'tierra-adentro', 'province' => 'Chubut', 'city' => 'Trelew', 'description' => 'Huerta agroecológica en la Patagonia. Cultivamos hortalizas, verduras de estación y hierbas aromáticas sin agroquímicos, respetando los ciclos naturales de la tierra.', 'production_practices' => 'Agroecología, rotación de cultivos, compostaje, sin pesticidas', 'production_origin' => 'Valle Inferior del Río Chubut', 'product_types' => 'Hortalizas agroecológicas', 'production_method' => 'agroecologico', 'story' => 'Demostramos que se puede producir alimentos sanos en la Patagonia. Nuestra huerta es un oasis de biodiversidad en el valle.'],
            ],
            [
                'user' => ['name' => 'Finca Raíces Verdes', 'email' => 'finca@raicesverdes.com'],
                'profile' => ['business_name' => 'Finca Raíces Verdes', 'slug' => 'finca-raices-verdes', 'province' => 'Córdoba', 'city' => 'Alta Gracia', 'description' => 'Finca familiar que produce alimentos naturales, hierbas para infusión y productos artesanales. Trabajamos con prácticas regenerativas y comercio justo.', 'production_practices' => 'Agricultura regenerativa, policultivos, sin químicos', 'production_origin' => 'Sierras de Córdoba', 'product_types' => 'Miel, hierbas, conservas', 'production_method' => 'natural', 'story' => 'Nuestra finca es un proyecto de vida. Cultivamos con amor y respeto por la naturaleza, ofreciendo alimentos reales a nuestra comunidad.'],
            ],
            [
                'user' => ['name' => 'Cerámicas del Valle', 'email' => 'ceramicas@valle.com'],
                'profile' => ['business_name' => 'Cerámicas del Valle', 'slug' => 'ceramicas-del-valle', 'province' => 'Salta', 'city' => 'Cafayate', 'description' => 'Cerámica artesanal de los Valles Calchaquíes. Piezas únicas elaboradas con arcilla local y técnicas ancestrales de la región.', 'production_practices' => 'Arcilla local, horno de leña, técnicas tradicionales', 'production_origin' => 'Valles Calchaquíes', 'product_types' => 'Cerámica artesanal', 'production_method' => 'artesanal', 'story' => 'Continuamos la tradición cerámica de nuestros ancestros. Cada pieza lleva la impronta de los valles y el sol salteño.'],
            ],
        ];

        $productsData = [
            // Verde Amanecer (id=1)
            ['producer_idx' => 0, 'name' => 'Jabón artesanal de caléndula', 'slug' => 'jabon-artesanal-de-calendula', 'description' => 'Jabón natural elaborado artesanalmente con aceite vegetal y caléndula orgánica. Suave para todo tipo de piel.', 'price_cents' => 190000, 'stock' => 32, 'unit' => 'unidad', 'production_type' => 'artesanal', 'delivery_type' => 'home_delivery', 'ecoscore_points' => 84, 'category' => 'cosmetica-natural'],
            ['producer_idx' => 0, 'name' => 'Crema hidratante de lavanda', 'slug' => 'crema-hidratante-de-lavanda', 'description' => 'Crema corporal hidratante con aceite esencial de lavanda orgánica cultivada en nuestra huerta.', 'price_cents' => 350000, 'stock' => 18, 'unit' => 'frasco', 'production_type' => 'artesanal', 'delivery_type' => 'home_delivery', 'ecoscore_points' => 88, 'category' => 'cosmetica-natural'],
            ['producer_idx' => 0, 'name' => 'Aceite esencial de menta', 'slug' => 'aceite-esencial-de-menta', 'description' => 'Aceite esencial puro de menta piperita destilado por vapor. Ideal para aromaterapia y masajes.', 'price_cents' => 280000, 'stock' => 25, 'unit' => 'frasco', 'production_type' => 'natural', 'delivery_type' => 'home_delivery', 'ecoscore_points' => 75, 'category' => 'cosmetica-natural'],

            // La Colmena Natural (id=1)
            ['producer_idx' => 1, 'name' => 'Miel natural de monte', 'slug' => 'miel-natural-de-monte', 'description' => 'Miel regional de producción familiar, cosechada en pequeños lotes en las sierras cordobesas. Sin pasteurizar.', 'price_cents' => 420000, 'stock' => 24, 'unit' => 'frasco', 'production_type' => 'natural', 'delivery_type' => 'local', 'ecoscore_points' => 90, 'category' => 'alimentos-naturales'],
            ['producer_idx' => 1, 'name' => 'Polen de abeja', 'slug' => 'polen-de-abeja', 'description' => 'Polen de abeja fresco recolectado de nuestras colmenas. Rico en proteínas y vitaminas naturales.', 'price_cents' => 310000, 'stock' => 15, 'unit' => 'frasco', 'production_type' => 'natural', 'delivery_type' => 'local', 'ecoscore_points' => 88, 'category' => 'alimentos-naturales'],
            ['producer_idx' => 1, 'name' => 'Propóleo en spray', 'slug' => 'propoleo-en-spray', 'description' => 'Extracto de propóleo en spray para defensas naturales. Elaborado con propóleos de nuestras colmenas.', 'price_cents' => 250000, 'stock' => 30, 'unit' => 'frasco', 'production_type' => 'natural', 'delivery_type' => 'local', 'ecoscore_points' => 85, 'category' => 'bienestar-y-salud-natural'],

            // Madera Viva (id=2)
            ['producer_idx' => 2, 'name' => 'Tabla de picar artesanal', 'slug' => 'tabla-de-picar-artesanal', 'description' => 'Tabla de picar de algarrobo macizo. Acabada con aceite de lino natural. Cada pieza es única.', 'price_cents' => 850000, 'stock' => 8, 'unit' => 'unidad', 'production_type' => 'artesanal', 'delivery_type' => 'pickup_point', 'ecoscore_points' => 80, 'category' => 'hogar-sostenible'],
            ['producer_idx' => 2, 'name' => 'Cuchara de madera tallada', 'slug' => 'cuchara-de-madera-tallada', 'description' => 'Cuchara utilitaria tallada a mano en madera de olivo. Ideal para cocina diaria.', 'price_cents' => 450000, 'stock' => 12, 'unit' => 'unidad', 'production_type' => 'artesanal', 'delivery_type' => 'pickup_point', 'ecoscore_points' => 82, 'category' => 'hogar-sostenible'],

            // Tierra Adentro (id=3)
            ['producer_idx' => 3, 'name' => 'Mix de verduras agroecológicas', 'slug' => 'mix-de-verduras-agroecologicas', 'description' => 'Bolsa de verduras de estación cultivadas sin agroquímicos. Incluye lechuga, acelga, rabanitos y zanahoria.', 'price_cents' => 250000, 'stock' => 20, 'unit' => 'bolsa', 'production_type' => 'agroecologico', 'delivery_type' => 'local', 'ecoscore_points' => 95, 'category' => 'huerta-y-productos-frescos'],
            ['producer_idx' => 3, 'name' => 'Huevos de campo', 'slug' => 'huevos-de-campo', 'description' => 'Huevos de gallinas criadas a campo, alimentadas con granos orgánicos. Docena.', 'price_cents' => 180000, 'stock' => 30, 'unit' => 'docena', 'production_type' => 'natural', 'delivery_type' => 'local', 'ecoscore_points' => 87, 'category' => 'huerta-y-productos-frescos'],

            // Finca Raíces Verdes (id=4)
            ['producer_idx' => 4, 'name' => 'Mix de hierbas para infusión', 'slug' => 'mix-de-hierbas-para-infusion', 'description' => 'Blend de hierbas regionales secadas naturalmente: menta, cedrón, manzanilla y burrito.', 'price_cents' => 280000, 'stock' => 40, 'unit' => 'paquete', 'production_type' => 'regional', 'delivery_type' => 'local', 'ecoscore_points' => 78, 'category' => 'bebidas-naturales'],
            ['producer_idx' => 4, 'name' => 'Dulce de cayote casero', 'slug' => 'dulce-de-cayote-casero', 'description' => 'Dulce de cayote artesanal elaborado siguiendo la receta tradicional de la abuela. Sin conservantes.', 'price_cents' => 220000, 'stock' => 25, 'unit' => 'frasco', 'production_type' => 'regional', 'delivery_type' => 'local', 'ecoscore_points' => 72, 'category' => 'alimentos-naturales'],
            ['producer_idx' => 4, 'name' => 'Té de hierbas serranas', 'slug' => 'te-de-hierbas-serranas', 'description' => 'Mezcla de hierbas autóctonas de las sierras cordobesas: peperina, poleo, tomillo y marcela.', 'price_cents' => 320000, 'stock' => 35, 'unit' => 'caja', 'production_type' => 'regional', 'delivery_type' => 'home_delivery', 'ecoscore_points' => 76, 'category' => 'bebidas-naturales'],

            // Cerámicas del Valle (id=5)
            ['producer_idx' => 5, 'name' => 'Jarrón de cerámica calchaquí', 'slug' => 'jarron-de-ceramica-calchaqui', 'description' => 'Jarrón decorativo de cerámica con motivos tradicionales de los Valles Calchaquíes.', 'price_cents' => 650000, 'stock' => 6, 'unit' => 'unidad', 'production_type' => 'artesanal', 'delivery_type' => 'pickup_point', 'ecoscore_points' => 70, 'category' => 'artesanias-y-productos-regionales'],
            ['producer_idx' => 5, 'name' => 'Set de tazas artesanales', 'slug' => 'set-de-tazas-artesanales', 'description' => 'Set de 4 tazas de cerámica con esmalte natural. Cada taza es única, hecha a torno y horneada con leña.', 'price_cents' => 980000, 'stock' => 4, 'unit' => 'set', 'production_type' => 'artesanal', 'delivery_type' => 'pickup_point', 'ecoscore_points' => 68, 'category' => 'artesanias-y-productos-regionales'],
        ];

        $producerModels = [];
        foreach ($producers as $data) {
            $user = User::create([
                'name' => $data['user']['name'],
                'email' => $data['user']['email'],
                'password' => Hash::make('password'),
                'role' => 'seller',
                'email_verified_at' => now(),
            ]);

            $profile = ProducerProfile::create(array_merge($data['profile'], [
                'user_id' => $user->id,
                'status' => 'active',
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]));

            $producerModels[] = $profile;
        }

        foreach ($productsData as $data) {
            $producer = $producerModels[$data['producer_idx']];
            $category = $catModels[$data['category']];

            $product = Product::create([
                'producer_profile_id' => $producer->id,
                'category_id' => $category->id,
                'name' => $data['name'],
                'slug' => $data['slug'],
                'description' => $data['description'],
                'price_cents' => $data['price_cents'],
                'currency' => 'ARS',
                'stock' => $data['stock'],
                'unit' => $data['unit'],
                'province' => $producer->province,
                'city' => $producer->city,
                'production_type' => $data['production_type'],
                'delivery_type' => $data['delivery_type'],
                'ecoscore_points' => $data['ecoscore_points'],
                'ecoscore_status' => 'manual_reviewed',
                'status' => 'active',
            ]);

            // Seed two deterministic placeholder images per product. picsum.photos
            // always resolves, and the frontend imageUrl() helper passes http(s)
            // paths through unchanged, so the catalog renders real imagery.
            ProductImage::create([
                'product_id' => $product->id,
                'path' => "https://picsum.photos/seed/{$data['slug']}/800/800",
                'alt_text' => $data['name'],
                'is_primary' => true,
                'sort_order' => 1,
            ]);
            ProductImage::create([
                'product_id' => $product->id,
                'path' => "https://picsum.photos/seed/{$data['slug']}-2/800/800",
                'alt_text' => $data['name'],
                'is_primary' => false,
                'sort_order' => 2,
            ]);
        }

        // ---- Buyer user ----
        $buyer = User::create([
            'name' => 'María Compradora',
            'email' => 'maria@compradora.com',
            'password' => Hash::make('password'),
            'role' => 'buyer',
            'email_verified_at' => now(),
        ]);

        // Second buyer
        $buyer2 = User::create([
            'name' => 'Juan Mercado',
            'email' => 'juan@mercado.com',
            'password' => Hash::make('password'),
            'role' => 'buyer',
            'email_verified_at' => now(),
        ]);

        // ---- Conversations ----
        // Conversation 1: buyer + producer 1 (Finca Raíces Verdes) about product "Mix de hierbas"
        $conv1 = Conversation::create([
            'buyer_id' => $buyer->id,
            'producer_profile_id' => $producerModels[4]->id,
            'product_id' => Product::where('slug', 'mix-de-hierbas-para-infusion')->first()->id,
            'status' => 'open',
            'last_message_at' => now()->subHours(2),
            'created_at' => now()->subDays(1),
        ]);
        Message::create([
            'conversation_id' => $conv1->id,
            'sender_id' => $buyer->id,
            'body' => 'Hola, ¿tienen el mix de hierbas disponible para envío a domicilio?',
            'created_at' => now()->subDays(1),
        ]);
        Message::create([
            'conversation_id' => $conv1->id,
            'sender_id' => $producerModels[4]->user_id,
            'body' => '¡Hola María! Sí, tenemos stock. Hacemos envíos a todo Córdoba. ¿A qué ciudad sería?',
            'created_at' => now()->subDays(1)->addHours(3),
        ]);
        Message::create([
            'conversation_id' => $conv1->id,
            'sender_id' => $buyer->id,
            'body' => 'A Alta Gracia. ¿Cuánto tardaría el envío?',
            'created_at' => now()->subHours(2),
        ]);

        // Conversation 2: buyer2 + producer 0 (Verde Amanecer) about jabón
        $conv2 = Conversation::create([
            'buyer_id' => $buyer2->id,
            'producer_profile_id' => $producerModels[0]->id,
            'product_id' => Product::where('slug', 'jabon-artesanal-de-calendula')->first()->id,
            'status' => 'open',
            'last_message_at' => now()->subHours(5),
            'created_at' => now()->subDays(2),
        ]);
        Message::create([
            'conversation_id' => $conv2->id,
            'sender_id' => $buyer2->id,
            'body' => 'Me interesa el jabón de caléndula. ¿Es apto para piel sensible?',
            'created_at' => now()->subDays(2),
        ]);
        Message::create([
            'conversation_id' => $conv2->id,
            'sender_id' => $producerModels[0]->user_id,
            'body' => 'Sí, Juan. Todos nuestros jabones son sin químicos sintéticos, ideales para piel sensible.',
            'created_at' => now()->subDays(2)->addHours(4),
        ]);

        // ---- Orders ----
        $products = Product::all()->keyBy('slug');

        // Order 1: buyer bought Mix de hierbas + Dulce de cayote
        $order1 = Order::create([
            'buyer_id' => $buyer->id,
            'order_number' => 'MA-'.now()->subDays(3)->format('Ymd').'-'.str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT),
            'status' => 'confirmed',
            'payment_status' => 'not_started',
            'delivery_type' => 'home_delivery',
            'delivery_address' => 'Av. San Martín 1234',
            'city' => 'Alta Gracia',
            'province' => 'Córdoba',
            'subtotal_cents' => 500000,
            'delivery_cents' => 0,
            'total_cents' => 500000,
            'buyer_note' => 'Prefiero entrega por la tarde.',
            'created_at' => now()->subDays(3),
        ]);

        $herbProduct = $products['mix-de-hierbas-para-infusion'];
        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $herbProduct->id,
            'producer_profile_id' => $herbProduct->producer_profile_id,
            'product_name' => $herbProduct->name,
            'unit_price_cents' => $herbProduct->price_cents,
            'quantity' => 1,
            'line_total_cents' => $herbProduct->price_cents,
        ]);

        $dulceProduct = $products['dulce-de-cayote-casero'];
        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $dulceProduct->id,
            'producer_profile_id' => $dulceProduct->producer_profile_id,
            'product_name' => $dulceProduct->name,
            'unit_price_cents' => $dulceProduct->price_cents,
            'quantity' => 1,
            'line_total_cents' => $dulceProduct->price_cents,
        ]);

        OrderStatusHistory::create([
            'order_id' => $order1->id,
            'changed_by' => $admin->id,
            'status' => 'pending',
            'note' => 'Pedido creado.',
            'created_at' => now()->subDays(3),
        ]);
        OrderStatusHistory::create([
            'order_id' => $order1->id,
            'changed_by' => $producerModels[4]->user_id,
            'status' => 'confirmed',
            'note' => 'Productor confirmó el pedido.',
            'created_at' => now()->subDays(2),
        ]);

        // Order 2: buyer2 bought Miel natural
        $order2 = Order::create([
            'buyer_id' => $buyer2->id,
            'order_number' => 'MA-'.now()->subDays(1)->format('Ymd').'-'.str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT),
            'status' => 'pending',
            'payment_status' => 'not_started',
            'delivery_type' => 'local',
            'delivery_address' => null,
            'city' => 'Córdoba',
            'province' => 'Córdoba',
            'subtotal_cents' => 840000,
            'delivery_cents' => 0,
            'total_cents' => 840000,
            'buyer_note' => null,
            'created_at' => now()->subDays(1),
        ]);

        $mielProduct = $products['miel-natural-de-monte'];
        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $mielProduct->id,
            'producer_profile_id' => $mielProduct->producer_profile_id,
            'product_name' => $mielProduct->name,
            'unit_price_cents' => $mielProduct->price_cents,
            'quantity' => 2,
            'line_total_cents' => $mielProduct->price_cents * 2,
        ]);

        OrderStatusHistory::create([
            'order_id' => $order2->id,
            'changed_by' => $buyer2->id,
            'status' => 'pending',
            'note' => 'Pedido creado.',
            'created_at' => now()->subDays(1),
        ]);
    }
}
