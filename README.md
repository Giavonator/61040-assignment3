# PlatMaison

Context: Plat Maison is Homemade Dish in French.

## 1. Concepts

Menu concept: [menu-og.md](menu-og.md).

Augmented Menu concept: [menu-ai.md](menu-ai.md).

## 2. User Interaction

![UI Sketch](./assets/UI_Sketches.png)

A user wants to add a recipe to their menu, so they navigate to the *Menu Page* within the application (see above). There they find an empty menu that requires their name and desired date for the menu, and then allows them to add their first recipe via two options: manually or online recipe. The user copies the URL from the website they found the recipe and adds it into the textbox and hit enter. After some amount of time the LLM behind the scenes finishes prosessing through the online recipe and adds all of its parsed information. The user is able to see exactly what the LLM parsed and realizes it mistaked the quantity of eggs, consequently, the user simply changes the quantity of the eggs within its respective textbox. The user also realizes it missed adding cinamon to the list of ingredients, so it adds it manually using the "Add new ingredient" option. Once the user finishes up this recipe they are able to continue adding as many other recipes as they like either using the LLM recipe parser or manually as well.

## 3. Richer Test Cases

Note: The LLM augmentation isn't supposed to be a one-shot prompt that gathers all of the ingredients and adds them perfectly to the recipe. If the LLM is able to gather anywhere from 40-80% of the ingredients, that would still be a success as it is reducing the number of necessary manual entries. For this specific reason the test cases below won't really "pass" or "fail", but rather will be discussed in percentages of the desired outcome.

### 3.1 Long Recipe Website

Test Case: Store the list of all ingredients for a very "fluffy" recipe website. Have the LLM parse the website and then analyze the percentage of ingredients it is able to parse correctly.

Difficulty: Some websites have very long intoductions to the recipe, variety of other recipes to consider, and overall "fluff" to increase ad revenue from user scrolling that can distract the LLM from finding the actual ingredients.

Prompt Variant #1: Include in more descriptive language to "DO NOT CONSIDER COMMENTS, STORIES, OR OTHER EXTRA COMMENTARY"

Prompt Variant #2: Instead of just the website URL provide the 'Copy Link to Highlight' towards to ingredient section, that way we can point the LLM in a better direction.

Prompt Variant #3: Provide general outline for what the important portion of the recipe websites would look like: "TITLE. AUTHOR. SERVINGS. INGREDIENTS."

Went well: The LLM was able to parse any where from 3-7 of the 11 ingredients, which means it has a potential to parse 70% of the ingredients for the user.

Went wrong: Very inconsistent. Even with same prompt with one execution you could get 3 ingredients and one right after you could get 8 instead. A big problem is the LLM making up ingredients or worse, incorrectly picking the wrong recipe just because the website said "Consider making XXXX on a different date!".

To improve: Only 50% of ingredients are being gathered regularly while majority of those are being processed properly. If we are able to gather at least a greater percentage of the actual ingredients reliably than maybe we can have greater success.

### 3.2 Bad User Input

Test Case: This test case should be very interesting as it isn't a direct test case where prompt variants try and improve the LLM, but rather I wanted to see how the LLM would handle different kinds of bad inputs. First manually input all the ingredients necessary that the LLM should find within the recipe. This time though, the test case assumes wrong/bad website url input provided from the user (more detail below). Analyze what the LLM will due in each respective case.

Difficulty: Bad user input.

Prompt Variant #1 (Captcha protected recipe): The [first website](https://www.nestle.com/stories/timeless-discovery-toll-house-chocolate-chip-cookie-recipe) had a basic anti bot checker that seemed like it should prevent the LLM from accessing it. Ultimately it did not, and the LLM was able to work fine and access all of the ingredients.

Prompt Variant #2 (Non recipe related url): This time I tried prompting with a url to a [How Tire's are Made](https://www.ustires.org/tires-101/how-tire-made) wiki to see if the LLM would still add things even though it is not a recipe. This actually ended up working "properly" as the LLM did would not return a complete JSON object for a recipe, meaning it determined that the website wasn't a recipe.

Prompt Variant #3 (Dropbox link to historical recipes): Our house stores all recipes within dropbox, so potentially a user in the future might consider using the URL to one of those recipes. I was curious to see whether the LLM would be able to see if, but mostly hopeful it wouldn't be able to as that should be privacy protected.

Went well: The LLM was able to determine that how to make a tire has nothing to do with a recipe and outputted nothing, which is good! For the captcha protection the LLM was able to parse 80-100% of the ingredients every time. The LLM was not able to access our private recipe information, good!

Went wrong: The captcha did not prevent the LLM from accessing the recipe (although it wasn't an exact captcha where you had to 'prove' you weren't a bot, but rather one of those automatic scans that determined if you were or not).

To improve: Specifically for the dropbox, the user may not know that won't work. Especially considering that is where we historically store all of our recipes. Therefore, some sort of mechanism to inform user that the LLM is unable to access that recipe would be good.

Note: I know this wasn't exactly one test case with three modifying prompts to improve upon the effectiveness, but I believe that the thought experiment behind what I did was as valuable as going through that process.

### 3.3 Youtube Video

Test Case: The original stakeholders for my application who would be using this LLM augmentation, could potentially be using recipes that are made from youtube videos! Although not something I thought of until now, it is reasonable to think that a user could input a youtube video of a recipe.

Difficulty: Youtube video isn't text content, how would an LLM parse through a video.

Prompt Variant #1: Provide extra information to LLM that if they determine the website is youtube, that they are able to view the transcript of the video.

Prompt Variant #2: Tell the LLM they are able to find HTML Transcription under <div id="segments-container" class"style-scope ytd-transcript-segment-list-renderer active">

Prompt Variant #3: Provide greater emphasis on ONLY taking ingredients from recipe within the video. NOT the recipe from a different youtube video that is suggested in the feed.

Went well: After informing the LLM that if its a youtube video that it can attempt parsing with the transcript, it actually began trying.

Went wrong: It NEVER actually took ingredients from the video, or even the appropriate recipe. Even with the exact HTML tag of where the LLM could look to find the ingredients, it would return arbitrary recipes that had nothing to do with the video or a recipe from the set of recommended videos.

To improve: Either implement some sort of mechanism that is capable of parsing through youtube videos, OR, simply inform users that youtube videos are not valid input.

## 4. Plausible Issues

### 4.1 Invalid Output

```TypeScript
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in the LLM response.');
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.name || !parsed.instructions || !parsed.servingQuantity || !parsed.dishType || !parsed.ingredients) {
        throw new Error('The parsed JSON is missing required fields.');
    }
```

It is absolutely critical that the LLM outputs a valid JSON object that contains everything that is necessary. There were times during testing that the LLM wasn't responding properly, which was completely throughing off the application. With slight modifcation to the prompt I was able to have the LLM reliably output the JSON object, but this validation is nevertheless critical in ensuring the output is valid.

### 4.2 Non Registered Items

```TypeScript
    console.warn(`⚠️ Could not add ingredient "${ing.name}": ${(error as Error).message}. Please enter it and add it manually.`);
```

The biggest 'validation' that could be done is if the LLM was trying to add an ingredient that the house has never been used before. The issue is that the LLM could potentially properly parse the ingredients, but it genuinely was a new ingredient that the house had never used. Because of this, this validation won't throw an error but rather a simple warning informing the user of the novel ingredient. That way they know if it hallucinated some arbitrary item, if it was simply parsed incorrectly, or if it is a new item that must be added to the set of items.

### 4.3 Ingredient + Instruction Match

```TypeScript
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
```

An AI suggested validation! When asking Gemini to *really* think about a good validation, it came up with the idea of verifying that the ingredients match the instructions. What if the LLM grabbed one set of ingredients but then made up the instructions! The validator above will ensure that at least 75% of the ingredients are in the instructions, and if not, it will throw an error.
