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
            throw error;
        }

        if (!data) {
            console.error("[Extraction] No data returned from Edge Function");
            return null;
        }

        return data as DiscoverRecipe;

    } catch (error) {
        console.error("Culinara Engine error (Edge):", error);
        return null;
    }
}
