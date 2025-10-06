import { GeminiLLM } from './gemini-llm';

/**
 * Represents a single ingredient with its cost.
 */
export interface Ingredient {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    cost?: number;
}

/**
 * Represents a complete recipe.
 */
export interface Recipe {
    id: string;
    title: string;
    instructions: string;
    servingQuantity: number;
    dishType: DishType;
    ingredients: Ingredient[];
    sourceUrl?: string;
}

export enum DishType {
    MeatProtein,
    VegProtein,
    Starch,
    Vegetable,
    Desert
}

export class PlatMaison {
    private recipes: Recipe[] = [];
    private nextId = 1;

    /**
     * Manually creates and stores a new recipe.
     * @param title The title of the recipe.
     * @param ingredients An array of ingredients.
     * @returns The newly created recipe.
     */
    create(name: string, instructions: string, servingQuantity: number, dishType: DishType): Recipe {
        const newRecipe: Recipe = {
            id: `recipe-${this.nextId++}`,
            title: name,
            instructions,
            servingQuantity,
            dishType,
            ingredients: [],
        };
        this.recipes.push(newRecipe);
        return newRecipe;
    }

    /**
     * Updates the top-level fields of an existing recipe.
     * @param recipeId The ID of the recipe to update.
     * @param updates An object with the fields to update (e.g., { title: "New Title" }).
     * @returns The updated recipe.
     */
    update(recipeId: string, updates: Partial<Omit<Recipe, 'id' | 'ingredients'>>): Recipe;
    update(recipeId: string, updates: Partial<Pick<Recipe, 'title' | 'instructions' | 'servingQuantity' | 'dishType' | 'sourceUrl'>>): Recipe {
        const recipe = this.getRecipeById(recipeId);
        if (!recipe) {
            throw new Error(`Recipe with ID "${recipeId}" not found.`);
        }

        Object.assign(recipe, updates);
        return recipe;
    }

    /**
     * Updates a specific ingredient within a recipe.
     * @param recipeId The ID of the recipe containing the ingredient.
     * @param ingredientId The ID of the ingredient to update.
     * @param updates An object with the fields to update (e.g., { cost: 5.99 }).
     * @returns The updated ingredient.
     */
    updateIngredient(recipeId: string, ingredientId: string, updates: Partial<Ingredient>): Ingredient {
        const recipe = this.getRecipeById(recipeId);
        if (!recipe) {
            throw new Error(`Recipe with ID "${recipeId}" not found.`);
        }

        const ingredient = recipe.ingredients.find(ing => ing.id === ingredientId);
        if (!ingredient) {
            throw new Error(`Ingredient with ID "${ingredientId}" not found in recipe "${recipeId}".`);
        }

        // Apply updates, but don't allow changing the ID
        const { id, ...restOfUpdates } = updates;
        Object.assign(ingredient, restOfUpdates);
        return ingredient;
    }

    /**
     * Uses an LLM to parse a recipe from a URL and add it to the collection.
     * @param url The URL of the online recipe.
     * @param llm An instance of the GeminiLLM client.
     * @returns A promise that resolves to the newly created recipe.
     */
    async pullFromRecipe(url: string, llm: GeminiLLM): Promise<Recipe> {
        console.log(`🤖 Requesting recipe parse for URL: ${url}`);
        const prompt = this.createPullFromRecipePrompt(url);
        const responseText = await llm.executeLLM(prompt);

        console.log('✅ Received response from Gemini AI!');
        return this.parseAndStoreRecipe(responseText, url);
    }

    /**
     * Helper to find a recipe by its ID.
     */
    private getRecipeById(recipeId: string): Recipe | undefined {
        return this.recipes.find(r => r.id === recipeId);
    }

    /**
     * Creates the prompt for the LLM to parse a recipe from a URL.
     */
    private createPullFromRecipePrompt(url: string): string {
        return `
You are a recipe parsing assistant. Your task is to extract recipe details from the provided URL and return them as a single, clean JSON object.

URL to parse: ${url}

CRITICAL REQUIREMENTS:
1.  Extract the recipe title, instructions, serving quantity, dish type, and ingredients.
2.  For each ingredient, extract its name, quantity, and unit.
3.  The dishType MUST be one of the following values: "MeatProtein", "VegProtein", "Starch", "Vegetable", "Desert".
4.  Do NOT invent or add any information not present in the source.
5.  If a value is not present for an ingredient or recipe detail, omit the key or set it to null.

OUTPUT FORMAT (MUST FOLLOW EXACTLY):
Return ONLY a single JSON object (no surrounding text or markdown) with this exact structure:
{
  "title": "The Recipe Title",
  "instructions": "1. Do this. 2. Do that.",
  "servingQuantity": 4,
  "dishType": "MainCourse",
  "ingredients": [
    { "name": "flour", "quantity": 2, "unit": "cups" },
    { "name": "sugar", "quantity": 1, "unit": "cup" },
    { "name": "eggs", "quantity": 3, "unit": "large" }
  ]
}

Return ONLY the JSON object.
`;
    }

    /**
     * Parses the LLM's JSON response and stores it as a new recipe.
     */
    private parseAndStoreRecipe(responseText: string, url: string): Recipe {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in the LLM response.');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (!parsed.title || !parsed.ingredients || !parsed.instructions || !parsed.servingQuantity || !parsed.dishType) {
                throw new Error('The parsed JSON is missing required fields: title, ingredients, instructions, servingQuantity, or dishType.');
            }

            const newRecipe = this.create(
                parsed.title,
                parsed.instructions,
                parsed.servingQuantity,
                parsed.dishType
            );
            
            // Since create now initializes an empty ingredients array, we add them here.
            newRecipe.ingredients = parsed.ingredients.map((ing: any, index: number) => ({
                ...ing,
                id: `ing-${newRecipe.id}-${index}`,
            }));

            newRecipe.sourceUrl = url; // Add the source URL to the created recipe

            console.log(`✅ Successfully parsed and stored recipe: "${newRecipe.title}"`);
            return newRecipe;

        } catch (error) {
            console.error('❌ Error parsing LLM response:', (error as Error).message);
            console.log('Raw Response:', responseText);
            throw error;
        }
    }

    /**
     * Displays all stored recipes to the console.
     */
    displayRecipes(): void {
        console.log('\n🍳 PlatMaison Recipes');
        console.log('======================');
        if (this.recipes.length === 0) {
            console.log('No recipes have been added yet.');
            return;
        }
        this.recipes.forEach(recipe => {
            console.log(`\n--- ${recipe.title} (ID: ${recipe.id}) ---`);
            if (recipe.sourceUrl) {
                console.log(`Source: ${recipe.sourceUrl}`);
            }

            console.log('\n  Ingredients:');
            recipe.ingredients.forEach(ing => {
                const costText = ing.cost ? ` ($${ing.cost.toFixed(2)})` : '';
                console.log(`    - ${ing.quantity} ${ing.unit} ${ing.name}${costText}`);
            });
        });
    }
}