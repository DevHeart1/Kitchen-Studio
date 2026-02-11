import { supabase } from '@/lib/supabase';
import { DiscoverRecipe } from '@/app/(tabs)/discover';

export async function extractRecipeFromVideoUrl(url: string): Promise<DiscoverRecipe | null> {
    try {
        console.log("[Extraction] Invoking Edge Function for:", url);

        const { data, error } = await supabase.functions.invoke('extract-recipe-from-video', {
            body: { videoUrl: url },
        });

        if (error) {
            console.error("[Extraction] Edge Function Error:", error);
            // If the key is missing on the server, this will return an error 
            // describing the issue (check server logs via supabase dashboard locally)
            return null;
        }

        if (!data) {
            console.error("[Extraction] No data returned from Edge Function");
            return null;
        }

        // The Edge Function returns the recipe in the correct format including id, image, provenance etc.
        return data as DiscoverRecipe;

    } catch (error: any) {
        if (error.message === "TypeError: Failed to fetch" || error.message.includes("fetch")) {
            console.error(
                "[Extraction] Network Error: Failed to connect to Supabase Edge Function. Check if the function is deployed or if you are offline.",
                error
            );
        } else {
            console.error("Culinara Engine error (Client):", error);
        }
        return null;
    }
}
