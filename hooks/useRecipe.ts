
import { useState, useEffect } from "react";

// Mock data or fetch logic
export function useRecipe(recipeId: string | undefined) {
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!recipeId) {
            setLoading(false);
            return;
        }

        // Simulate fetch
        setTimeout(() => {
            setRecipe({
                id: recipeId,
                title: "Pancakes",
                image: "https://example.com/pancakes.jpg",
                ingredients: [
                    { name: "Flour", amount: "2", unit: "cups" },
                    { name: "Milk", amount: "1.5", unit: "cups" },
                    { name: "Eggs", amount: "2", unit: "pcs" },
                ],
                instructions: [
                    { step: "Mix flour and milk", timerSeconds: 0 },
                    { step: "Add eggs and whisk", timerSeconds: 30 },
                    { step: "Heat pan and pour batter", timerSeconds: 0 },
                    { step: "Flip when bubbly", timerSeconds: 0 },
                ],
            });
            setLoading(false);
        }, 500);
    }, [recipeId]);

    return { recipe, loading };
}
