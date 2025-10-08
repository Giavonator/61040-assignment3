import { GeminiLLM } from './gemini-llm';

/**
 * Represents a single purchasable item.
 */
export interface Item {
    name: string;
    price: number;
    quantity: number; // e.g., 3
    units: string;    // e.g., "lbs"
    store: string;
    confirmed: boolean;
}

/**
 * Represents an ingredient within a recipe, linking to an Item and specifying the amount.
 */
export interface Ingredient {
    item: Item;
    amount: number;
}

/**
 * Represents a single recipe.
 */
export interface Recipe {
    id: string;
    name: string;
    instructions: string;
    servingQuantity: number;
    dishType: string;
    scalingFactor: number;
    ingredients: Ingredient[];
    dishPrice: number;
}

/**
 * Represents a full menu for a specific date.
 */
export interface Menu {
    id: string;
    name: string;
    date: string;
    recipes: Recipe[];
    menuCost: number;
}

/**
 * Unified MenuManager Concept with state and actions.
 */
export class MenuManager {
    private menus: Menu[] = [];
    private items: Item[] = [];
    private nextId = 1;

    /**
     * Enters a new, unconfirmed item into the system.
     */
    enterItem(name: string, price: number, quantity: number, units: string, store: string): Item {
        if (this.findItemByName(name)) {
            throw new Error(`Item with name "${name}" already exists.`);
        }
        const newItem: Item = { name, price, quantity, units, store, confirmed: false };
        this.items.push(newItem);
        return newItem;
    }

    /**
     * Confirms an existing item for Administrator role.
     */
    confirmItem(name: string): Item {
        const item = this.findItemByName(name);
        if (!item) {
            throw new Error(`Item with name "${name}" not found.`);
        }
        if (item.confirmed) {
            throw new Error(`Item "${name}" has already been confirmed.`);
        }
        item.confirmed = true;
        return item;
    }

    /**
     * Updates the properties of an existing item. Typically for an Administrator role.
     */
    updateItem(name: string, updates: Partial<Omit<Item, 'name' | 'confirmed'>>): Item {
        const item = this.findItemByName(name);
        if (!item) {
            throw new Error(`Item with name "${name}" not found.`);
        }
        Object.assign(item, updates);
        // After updating an item's price, we should recalculate costs for all menus
        this.recalculateAllMenuCosts();
        return item;
    }

    /**
     * Creates a new, empty menu.
     */
    createMenu(name: string, date: string): Menu {
        const newMenu: Menu = {
            id: `menu-${this.nextId++}`,
            name,
            date,
            recipes: [],
            menuCost: 0,
        };
        this.menus.push(newMenu);
        return newMenu;
    }

    /**
     * Manually adds a new recipe to a specified menu.
     */
    createRecipe(menuId: string, name: string, instructions: string, servingQuantity: number, dishType: string, scalingFactor: number = 1.0): Recipe {
        const menu = this.findMenuById(menuId);
        if (!menu) {
            throw new Error(`Menu with ID "${menuId}" not found.`);
        }
        const newRecipe: Recipe = {
            id: `recipe-${this.nextId++}`,
            name,
            instructions,
            servingQuantity,
            dishType,
            scalingFactor,
            ingredients: [],
            dishPrice: 0,
        };
        menu.recipes.push(newRecipe);
        return newRecipe;
    }

    /**
     * Uses an LLM to parse a recipe from a URL and add it to a menu.
     */
    async pullRecipeFromWebsite(menuId: string, url: string, llm: GeminiLLM): Promise<Recipe> {
        const menu = this.findMenuById(menuId);
        if (!menu) {
            throw new Error(`Menu with ID "${menuId}" not found.`);
        }

        console.log(`🤖 Requesting recipe parse for URL: ${url}`);
        const prompt = this.createPullRecipePrompt(url);
        const responseText = await llm.executeLLM(prompt);
        console.log('✅ Received response from Gemini AI!');

        return this.parseAndAddRecipe(menu, responseText);
    }

    /**
     * Adds or updates an ingredient for a recipe.
     */
    updateIngredient(menuId: string, recipeId: string, itemName: string, amount: number): Recipe {
        const menu = this.findMenuById(menuId);
        if (!menu) {
            throw new Error(`Menu with ID "${menuId}" not found.`);
        }
        const recipe = this.findRecipeById(menu, recipeId);
        if (!recipe) {
            throw new Error(`Recipe with ID "${recipeId}" not found in menu "${menuId}".`);
        }

        const item = this.findItemByName(itemName);
        if (!item) {
            throw new Error(`Item "${itemName}" not found. Please enter it first using enterItem().`);
        }

        const existingIngredient = recipe.ingredients.find(ing => ing.item.name === itemName);
        if (existingIngredient) {
            existingIngredient.amount = amount;
        } else {
            recipe.ingredients.push({ item, amount });
        }

        this.recalculateCosts(menu, recipe);
        return recipe;
    }

    // --- Helper and Private Methods ---

    private findItemByName(name: string): Item | undefined {
        return this.items.find(item => item.name.toLowerCase() === name.toLowerCase());
    }

    private recalculateCosts(menu: Menu, recipe: Recipe): void {
        recipe.dishPrice = recipe.ingredients.reduce((total, ing) => {
            const itemCostPerUnit = ing.item.price / ing.item.quantity;
            return total + (itemCostPerUnit * ing.amount * recipe.scalingFactor);
        }, 0);
        menu.menuCost = menu.recipes.reduce((total, r) => total + r.dishPrice, 0);
    }
    
    private recalculateAllMenuCosts(): void {
        this.menus.forEach(menu => {
            menu.recipes.forEach(recipe => {
                this.recalculateCosts(menu, recipe);
            });
        });
    }

    private createPullRecipePrompt(url: string): string {
        return `
You are an expert recipe parsing assistant. Your task is to analyze the HTML from the provided URL, find the main recipe card, and extract key details into a clean JSON object.

URL to parse: ${url}
If URL contains '#:~:text' that means the URL is specifically pointing you to where the ingredients are on the page. You should go look for them there.
If Youtube video you can find transcript of video within HTML under this div:
    <div id="segments-container" class"style-scope ytd-transcript-segment-list-renderer active">

**Analysis and Extraction Strategy:**
1.  **Find the Recipe Card:** Scan the page for a primary, well-structured recipe section. These are often in a container or a specific class. Ignore introductory stories, comments, and sidebars with other recipe links.
2.  **Extract Core Details:** From within that recipe card, extract the recipe's name, the full text of the instructions, the serving quantity (as a number), and the dish type (e.g., "Main Course", "Dessert", "Side Dish").
3.  **Extract Ingredients with Precision:**
    *   Locate the definitive ingredients list within the recipe card.
    *   For each ingredient line, parse out the **name** and the **amount**.
    *   The **name** should be the core ingredient (e.g., "chicken broth", "white rice").
    *   Simplify the **name** to the base ingredient (e.g., "black pepper" -> "pepper", "long grain white rice" -> "white rice").
    *   The **amount** should be the numerical quantity required for the recipe (e.g., for "1 1/2 cups chicken broth", the amount is 1.5). If no number is present (e.g., "salt to taste"), set the amount to 1.

**Sample Parsing**
DO NOT TAKE ANYTHING FROM EXTRA STORIES COMMENTS OR SIDEBARS.
Important data will generally be in consice format like this:
------
The Best Chocolate Chip Cookie Recipe Ever
This is the best chocolate chip cookie recipe ever. No funny ingredients, no chilling time, etc. Just a simple, straightforward, amazingly delicious, doughy yet still fully cooked, chocolate chip cookie that turns out perfectly every single time! 
Servings: 36

Ingredients:
-1 cup salted butter softened
-1 cup granulated sugar
-1 cup light brown sugar packed
-2 teaspoons pure vanilla extract
-2 large eggs
-3 cups all-purpose flour
-1 teaspoon baking soda
-½ teaspoon baking powder
-1 teaspoon sea salt
-2 cups chocolate chips (12 oz)
Instructions 
Preheat oven to 375 degrees Fahrenheit (190 degrees Celsius). Line three baking sheets with parchment paper and set aside.
In a medium bowl mix flour, baking soda, baking powder and salt. Set aside.
Cream together butter and sugars until combined.
Beat in eggs and vanilla until light (about 1 minute).
Mix in the dry ingredients until combined.
Add chocolate chips and mix well.
Roll 2-3 Tablespoons (depending on how large you like your cookies) of dough at a time into balls and place them evenly spaced on your prepared cookie sheets.
Bake in preheated oven for approximately 8-10 minutes. Take them out when they are just barely starting to turn brown.
Let them sit on the baking pan for 5 minutes before removing to cooling rack.
------

**CRITICAL OUTPUT REQUIREMENTS:**
*   Return ONLY a single JSON object. Do not include any surrounding text, explanations, or markdown formatting.
*   The JSON must follow this exact structure. Omit any fields where a value cannot be found.

{
  "name": "The Exact Recipe Name",
  "instructions": "1. First step from the recipe. 2. Second step from the recipe.",
  "servingQuantity": 8,
  "dishType": "Main Course",
  "ingredients": [
    { "name": "boneless skinless chicken breasts", "amount": 1.5 },
    { "name": "olive oil", "amount": 1 },
    { "name": "salt", "amount": 0.5 },
    { "name": "black pepper", "amount": 0.25 }
  ]
}

Now, analyze the URL and provide the JSON object.`;
    }

    private parseAndAddRecipe(menu: Menu, responseText: string): Recipe {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON object found in the LLM response.');
            
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.name || !parsed.instructions || !parsed.servingQuantity || !parsed.dishType || !parsed.ingredients) {
                throw new Error('The parsed JSON is missing required fields.');
            }

            let mentionedIngredients = 0;
            const instructionsText = parsed.instructions.toLowerCase();
            for (const ing of parsed.ingredients) {
                // Check for the core part of the ingredient name.
                const coreName = ing.name.split(' ').pop()?.toLowerCase() ?? '';
                if (coreName && instructionsText.includes(coreName)) {
                    mentionedIngredients++;
                }
            }

            const mentionedPercentage = (mentionedIngredients / parsed.ingredients.length) * 100;
            // If less than 75% of ingredients are mentioned, it's suspicious.
            if (mentionedPercentage < 75) {
                throw new Error(`Semantic Validation Failed: Only ${mentionedPercentage.toFixed(0)}% of ingredients are mentioned in the instructions. The instructions and ingredients may not match.`);
            } else {
                console.log(`✅ Instructions: ${mentionedPercentage.toFixed(0)}% of ingredients are mentioned in the instructions which means the instructions likely match the ingredients.`);
            }

            const newRecipe = this.createRecipe(
                menu.id,
                parsed.name,
                parsed.instructions,
                parsed.servingQuantity,
                parsed.dishType
            );

            for (const ing of parsed.ingredients) {
                try {
                    this.updateIngredient(menu.id, newRecipe.id, ing.name, ing.amount);
                } catch (error) {
                    console.warn(`⚠️ Could not add ingredient "${ing.name}": ${(error as Error).message}. Please enter it and add it manually.`);
                }
            }

            console.log(`✅ Successfully parsed and stored recipe: "${newRecipe.name}"`);
            return newRecipe;
        } catch (error) {
            console.error('❌ Error parsing LLM response:', (error as Error).message);
            throw error;
        }
    }

    private findMenuById(menuId: string): Menu | undefined {
        return this.menus.find(m => m.id === menuId);
    }

    private findRecipeById(menu: Menu, recipeId: string): Recipe | undefined {
        return menu.recipes.find(r => r.id === recipeId);
    }

    // --- Display Methods ---

    displayMenus(): void {
        console.log('\n📅 Menu Overviews');
        console.log('==================');
        if (this.menus.length === 0) {
            console.log('No menus created yet.');
            return;
        }
        this.menus.forEach(menu => {
            console.log(`\n--- Menu: ${menu.name} (${menu.date}) ---`);
            console.log(`Total Cost: $${menu.menuCost.toFixed(2)}`);
            console.log('Recipes:');
            if (menu.recipes.length === 0) {
                console.log('  No recipes added yet.');
            } else {
                menu.recipes.forEach(recipe => {
                    console.log(`  - ${recipe.name} (Serves: ${recipe.servingQuantity}, Cost: $${recipe.dishPrice.toFixed(2)})`);
                    recipe.ingredients.forEach(ing => {
                        console.log(`    - ${ing.amount} ${ing.item.units} ${ing.item.name}`);
                    });
                });
            }
        });
    }

    displayItems(): void {
        console.log('\n🛒 Master Item List');
        console.log('==================');
        if (this.items.length === 0) {
            console.log('No items have been entered yet.');
            return;
        }
        this.items.forEach(item => {
            const confirmedStatus = item.confirmed ? '✅ Confirmed' : '⏳ Unconfirmed';
            console.log(`\n- ${item.name} [${confirmedStatus}]`);
            console.log(`  Price: $${item.price.toFixed(2)} for ${item.quantity} ${item.units}`);
            console.log(`  Store: ${item.store}`);
        });
    }
}
