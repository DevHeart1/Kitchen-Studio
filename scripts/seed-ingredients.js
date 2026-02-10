const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase (Use your project URL and Key)
// Replace with process.env or hardcoded for this script only
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_KEY = process.env.EXPO_PUBLIC_ANON_KEY || "your-anon-key";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STANDARD_CUP_ML = 236.6;

const PROFILES = [
    // --- Nigerian / Local Staples ---
    { name: "garri", gram_per_ml: 160 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "egusi", gram_per_ml: 120 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "ogbono", gram_per_ml: 130 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "rice", gram_per_ml: 190 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "beans", gram_per_ml: 200 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "yam flour", gram_per_ml: 130 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "elubo", gram_per_ml: 130 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "semolina", gram_per_ml: 150 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "wheat flour", gram_per_ml: 120 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "ground crayfish", gram_per_ml: 100 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "crayfish", gram_per_ml: 100 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "ground pepper", gram_per_ml: 120 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "pepper", gram_per_ml: 120 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "salt", gram_per_ml: 280 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "sugar", gram_per_ml: 200 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "dried fish", gram_per_ml: 120 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "stock fish", gram_per_ml: 140 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "onion", gram_per_ml: 160 / STANDARD_CUP_ML, gram_per_count: 110, base_unit: "g" },
    { name: "tomato", gram_per_ml: 240 / STANDARD_CUP_ML, gram_per_count: 120, base_unit: "g" },

    // --- Oils / Liquids ---
    { name: "palm oil", gram_per_ml: 0.93, base_unit: "ml" },
    { name: "vegetable oil", gram_per_ml: 0.92, base_unit: "ml" },
    { name: "water", gram_per_ml: 1, base_unit: "ml" },
    { name: "honey", gram_per_ml: 1.42, base_unit: "ml" },

    // --- Defaults / Common ---
    { name: "flour", gram_per_ml: 120 / STANDARD_CUP_ML, base_unit: "g" },
    { name: "butter", gram_per_ml: 0.911, base_unit: "g" },
];

async function seed() {
    console.log("Seeding ingredient_profiles...");

    // Check if table exists (by trying to select)
    const { error: checkError } = await supabase.from("ingredient_profiles").select("id").limit(1);
    if (checkError) {
        console.error("Error accessing table. Please run schema migration first:", checkError.message);
        return;
    }

    // Insert data (upsert to avoid dupes)
    for (const p of PROFILES) {
        const { error } = await supabase.from("ingredient_profiles").upsert(
            {
                name: p.name,
                gram_per_cup: p.gram_per_ml * STANDARD_CUP_ML,
                base_unit: p.base_unit
            },
            { onConflict: "name" }
        );

        if (error) console.error(`Failed to insert ${p.name}:`, error.message);
        else console.log(`Inserted/Updated: ${p.name}`);
    }
}

seed();
