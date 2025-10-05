# PlatMaison

Context: Plat Maison is Homemade Dish in French.

## 1. Concepts

You are able to find the original concept here: [platMaison_OG.md](platMaison_OG.md).

You can find the AI augmented concept here: [platMaison_AI.md](platMaison_AI.md).

Note: Today's implementation will only include the PlatMaison concept. Meaning that although the concept ties closely with the Item and User concepts, they will not be implemented today.

## 2. User Interaction

![UI Sketch](./assets/UI_Sketches.png)

A user wants to add a recipe to their menu, so they navigate to the *Menu Page* within the application. There they find an empty menu that allows them to add their first recipe via two options: manually or online recipe. As the user is pulling their recipe from an online website, they insert the URL of the recipe into the textbox and hit enter. After some amount of time the LLM behind the scenes finishes prosessing through the online recipe and adds all of its parsed information. The user is able to see exactly what the LLM parsed and realizes it mistaked the cost of eggs, consequently, the user simply changes the cost of the eggs within its respective textbox. The user also realizes it missed adding cinamon to the list of ingredients, so it adds it manually using the "Add new ingredient" option. Finally the user is all set and finished writing their recipe!
