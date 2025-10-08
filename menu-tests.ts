/**
 * MenuManager Test Cases
 * 
 * Demonstrates manual menu and recipe creation.
 */

import { MenuManager } from './menu';
import { GeminiLLM, Config } from './gemini-llm';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Test case 0: Manual Menu and Recipe Creation
 * Demonstrates creating a menu, adding items to the master list, creating recipes,
 * and adding ingredients to those recipes.
 */
export async function testManualMenuCreation(): Promise<void> {
    console.log('\n🧪 TEST CASE 0: Manual Menu Creation');
    console.log('======================================');
    
    const menuManager = new MenuManager();
    
    // 1. Adding necessary ingredients to the master item list.
    console.log('🛒 Adding items to the master list...');
    menuManager.enterItem('Chicken Breast', 8.99, 2, 'lbs', 'SuperMart');
    menuManager.enterItem('Broccoli', 2.50, 1, 'head', 'SuperMart');
    menuManager.enterItem('White Rice', 5.00, 5, 'lbs', 'SuperMart');
    menuManager.enterItem('Flour', 3.00, 5, 'lbs', 'SuperMart');
    menuManager.enterItem('Sugar', 4.50, 4, 'lbs', 'SuperMart');
    menuManager.enterItem('Eggs', 3.50, 12, 'count', 'SuperMart');
    menuManager.enterItem('Chocolate Chips', 4.00, 1, 'bag', 'SuperMart');
    
    // Display the master item list
    menuManager.displayItems();

    // 2. Creating a menu.
    console.log('\n📅 Creating a new menu...');
    const myMenu = menuManager.createMenu('Weekly Dinner Plan', '2025-10-08');
    console.log(`✅ Menu "${myMenu.name}" created for ${myMenu.date}.`);

    // 3. Adding two different recipes to the menu.
    console.log('\n📝 Adding first recipe: Chicken and Rice...');
    const chickenRecipe = menuManager.createRecipe(
        myMenu.id,
        'Simple Chicken and Rice',
        '1. Cook chicken. 2. Cook rice. 3. Mix and serve.',
        4,
        'Main Course'
    );
    
    console.log('  - Adding ingredients to Chicken and Rice...');
    menuManager.updateIngredient(myMenu.id, chickenRecipe.id, 'Chicken Breast', 1.5); // 1.5 lbs
    menuManager.updateIngredient(myMenu.id, chickenRecipe.id, 'White Rice', 2); // 2 cups (assuming 1 cup is 0.5 lbs from a 5lb bag)
    menuManager.updateIngredient(myMenu.id, chickenRecipe.id, 'Broccoli', 1); // 1 head

    console.log('\n📝 Adding second recipe: Chocolate Chip Cookies...');
    const cookieRecipe = menuManager.createRecipe(
        myMenu.id,
        'Classic Chocolate Chip Cookies',
        '1. Mix ingredients. 2. Bake at 375°F for 10-12 minutes.',
        24,
        'Dessert'
    );

    console.log('  - Adding ingredients to Chocolate Chip Cookies...');
    menuManager.updateIngredient(myMenu.id, cookieRecipe.id, 'Flour', 2.25); // 2.25 cups
    menuManager.updateIngredient(myMenu.id, cookieRecipe.id, 'Sugar', 0.75); // 0.75 cups
    menuManager.updateIngredient(myMenu.id, cookieRecipe.id, 'Eggs', 2); // 2 eggs
    menuManager.updateIngredient(myMenu.id, cookieRecipe.id, 'Chocolate Chips', 1); // 1 bag
    
    // 4. Displaying that menu.
    console.log('\n✅ Final Menu Structure:');
    menuManager.displayMenus();
}

/**
 * Test case 1: LLM-Assisted Recipe Creation
 * Demonstrates creating a menu and pulling a recipe from a website using the LLM.
 */
export async function testLLMLongRecipeCreation(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: LLM-Assisted Long Recipe Creation');
    console.log('=============================================');

    const config = loadConfig();
    // Exit if the API key is not found, as it's required for this test.
    if (config.apiKey === 'test-key-not-found') {
        console.error('❌ API key not found in config.json. Skipping LLM test.');
        process.exit(1);
    }

    const llm = new GeminiLLM(config);
    const menuManager = new MenuManager();
    const recipeUrl = 'https://www.iheartnaptime.net/chicken-and-rice-recipe/';
    const altRecipeUrl = 'https://www.iheartnaptime.net/chicken-and-rice-recipe/#:~:text=%E2%96%BA-,Ingredients,-3%2D4%20Tablespoons';

    // Pre-load the item store with ingredients we expect the LLM to find.
    // This allows the system to calculate costs automatically after parsing.
    console.log('🛒 Pre-loading master item list for cost calculation...');
    menuManager.enterItem('chicken breasts', 8.99, 2, 'lbs', 'SuperMart');
    menuManager.enterItem('chicken thighs', 8.99, 2, 'lbs', 'SuperMart');
    menuManager.enterItem('butter', 3.99, 1, 'lb', 'SuperMart');
    menuManager.enterItem('onion', 1.50, 2, 'lbs', 'SuperMart');
    menuManager.enterItem('garlic', 4.00, 8, 'oz', 'SuperMart');
    menuManager.enterItem('jasmine rice', 5.00, 5, 'lbs', 'SuperMart');
    menuManager.enterItem('carrots', 1.00, 1, 'unit', 'SuperMart');
    menuManager.enterItem('yellow onion', 1.50, 2, 'unit', 'SuperMart');
    menuManager.enterItem('chicken broth', 2.50, 32, 'oz', 'SuperMart');
    menuManager.enterItem('salt', 2.00, 1, 'lb', 'SuperMart');
    menuManager.enterItem('pepper', 2.50, 4, 'oz', 'SuperMart');
    menuManager.enterItem('parmesian cheese', 6.50, 8, 'oz', 'SuperMart');
    menuManager.enterItem('fresh parsley', 1.99, 1, 'bunch', 'SuperMart');
    menuManager.displayItems();

    // Create a menu to add the recipe to.
    console.log('\n📅 Creating a new menu for the LLM recipe...');
    const llmMenu = menuManager.createMenu('LLM-Generated Dinner', '2025-10-09');

    // Pull the recipe from the website.
    console.log(`\n🌐 Pulling recipe from URL: ${recipeUrl}`);
    await menuManager.pullRecipeFromWebsite(llmMenu.id, recipeUrl, llm);

    // Display the final menu.
    console.log('\n✅ Final Menu Structure after LLM parsing:');
    menuManager.displayMenus();
}

/**
 * Test case 2: LLM-Assisted Bad User Input Recipe Creation
 * Demonstrates creating a menu and pulling a recipe from a website using the LLM.
 */
export async function testLLMBadUserInputRecipeCreation(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: LLM-Assisted Bad User Input Recipe Creation');
    console.log('=============================================');

    const config = loadConfig();
    // Exit if the API key is not found, as it's required for this test.
    if (config.apiKey === 'test-key-not-found') {
        console.error('❌ API key not found in config.json. Skipping LLM test.');
        process.exit(1);
    }

    const llm = new GeminiLLM(config);
    const menuManager = new MenuManager();
    const recipeUrl1 = 'https://www.nestle.com/stories/timeless-discovery-toll-house-chocolate-chip-cookie-recipe';
    const recipeUrl2 = 'https://www.ustires.org/tires-101/how-tire-made';
    const recipeUrl3 = 'https://www.dropbox.com/home/LMF%20Menus/Menus%20Fall%202025/10.26%20-%2010.31';

    // Pre-load the item store with ingredients we expect the LLM to find.
    // This allows the system to calculate costs automatically after parsing.
    console.log('🛒 Pre-loading master item list for cost calculation...');
    menuManager.enterItem('all-purpose flour', 3.00, 5, 'lbs', 'SuperMart');
    menuManager.enterItem('flour', 3.00, 5, 'lbs', 'SuperMart');
    menuManager.enterItem('baking soda', 1.50, 16, 'oz', 'SuperMart');
    menuManager.enterItem('salt', 2.00, 1, 'lb', 'SuperMart');
    menuManager.enterItem('butter', 4.50, 1, 'lb', 'SuperMart');
    menuManager.enterItem('sugar', 3.00, 4, 'lbs', 'SuperMart');
    menuManager.enterItem('granulated sugar', 3.00, 4, 'lbs', 'SuperMart');
    menuManager.enterItem('brown sugar', 2.50, 2, 'lbs', 'SuperMart');
    menuManager.enterItem('vanilla extract', 5.00, 4, 'oz', 'SuperMart');
    menuManager.enterItem('eggs', 3.50, 12, 'count', 'SuperMart');
    menuManager.enterItem('chocolate', 4.00, 12, 'oz', 'SuperMart');
    menuManager.enterItem('chocolate chips', 4.00, 12, 'oz', 'SuperMart');
    menuManager.enterItem('nuts', 6.00, 16, 'oz', 'SuperMart');
    menuManager.displayItems();    // Create a menu to add the recipe to.
    console.log('\n📅 Creating a new menu for the LLM recipe...');
    const llmMenu = menuManager.createMenu('LLM-Generated Dinner', '2025-10-09');

    // Pull the recipe from the website.
    console.log(`\n🌐 Pulling recipe from URL: ${recipeUrl1}`);
    await menuManager.pullRecipeFromWebsite(llmMenu.id, recipeUrl1, llm);

    // Display the final menu.
    console.log('\n✅ Final Menu Structure after LLM parsing:');
    menuManager.displayMenus();
}

/**
 * Test case 3: LLM-Assisted Youtube Video Recipe Creation
 * Demonstrates creating a menu and pulling a recipe from a website using the LLM.
 */
export async function testLLMYoutubeVideoRecipeCreation(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: LLM-Assisted Youtube Video Recipe Creation');
    console.log('=============================================');

    const config = loadConfig();
    // Exit if the API key is not found, as it's required for this test.
    if (config.apiKey === 'test-key-not-found') {
        console.error('❌ API key not found in config.json. Skipping LLM test.');
        process.exit(1);
    }

    const llm = new GeminiLLM(config);
    const menuManager = new MenuManager();
    const recipeUrl = 'https://www.youtube.com/watch?v=rEdl2Uetpvo';

    // Pre-load the item store with ingredients we expect the LLM to find.
    // This allows the system to calculate costs automatically after parsing.
    console.log('🛒 Pre-loading master item list for cost calculation...');
    menuManager.enterItem('all-purpose flour', 3.00, 5, 'lbs', 'SuperMart');
    menuManager.enterItem('flour', 3.00, 5, 'lbs', 'SuperMart');
    menuManager.enterItem('baking soda', 1.50, 16, 'oz', 'SuperMart');
    menuManager.enterItem('salt', 2.00, 1, 'lb', 'SuperMart');
    menuManager.enterItem('butter', 4.50, 1, 'lb', 'SuperMart');
    menuManager.enterItem('sugar', 3.00, 4, 'lbs', 'SuperMart');
    menuManager.enterItem('granulated sugar', 3.00, 4, 'lbs', 'SuperMart');
    menuManager.enterItem('brown sugar', 2.50, 2, 'lbs', 'SuperMart');
    menuManager.enterItem('vanilla extract', 5.00, 4, 'oz', 'SuperMart');
    menuManager.enterItem('eggs', 3.50, 12, 'count', 'SuperMart');
    menuManager.enterItem('chocolate', 4.00, 12, 'oz', 'SuperMart');
    menuManager.enterItem('chocolate chips', 4.00, 12, 'oz', 'SuperMart');
    menuManager.enterItem('nuts', 6.00, 16, 'oz', 'SuperMart');
    menuManager.displayItems();    // Create a menu to add the recipe to.
    console.log('\n📅 Creating a new menu for the LLM recipe...');
    const llmMenu = menuManager.createMenu('LLM-Generated Dinner', '2025-10-09');

    // Pull the recipe from the website.
    console.log(`\n🌐 Pulling recipe from URL: ${recipeUrl}`);
    await menuManager.pullRecipeFromWebsite(llmMenu.id, recipeUrl, llm);

    // Display the final menu.
    console.log('\n✅ Final Menu Structure after LLM parsing:');
    menuManager.displayMenus();
}

/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('🍽️  MenuManager Test Suite');
    console.log('========================\n');
    
    try {
        // Run manual scheduling test
        await testManualMenuCreation();
        
        // Run LLM recipe creation test
        await testLLMLongRecipeCreation();

        // Run LLM recipe creation test
        await testLLMBadUserInputRecipeCreation();

        // Run LLM recipe creation test
        await testLLMYoutubeVideoRecipeCreation();
        
        console.log('\n🎉 All test cases completed successfully!');
        
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}
