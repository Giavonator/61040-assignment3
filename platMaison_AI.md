
# PlatMaison (AI Augmented)

**concept** PlatMaison [Item, User, URL]

**purpose** grouping of necessary items to make a particular dish

**principle** A user would like to make a certain dish and needs the ingredients to make it. In order to purchase said ingredients they *create* a dish and then *updateIngredient* to add/update/remove ingredients as needed. On top of the manual *create* and *updateIngredients*, if they are pulling from an online recipe they can use *pullFromRecipe* which is an LLM augmented concept that will automatically parse through the online ingredients.  They user is able to *update* the attibutes to their recipe as needed for both the manual and LLM updates.

**state**  
    a set of Recipe with\
        a set of Item with\
              an amount Int\
        a name String\
        an instructions String\
        a dishPrice Float\
        a servingQuantity Int\
        a dishType String\
        an owner User

**actions**\
    pullFromRecipe(recipeURL: String): (recipe: Recipe)\
            **effects** Using an LLM prompt to parse through the online recipeURL, creates recipe with all the information that it was able to parse and user can *updateIngredient* as necessary \
    create (name: String, instructions: String, servingQuantity: Int, dishType: String): (recipe: Recipe)\
            **effects** returns new empty recipe with name, instrucitons, and servingQuantity attributes that is owned by calling user\
    updateIngredient (recipe: Recipe, item: Item, amount: Int)\
            **requires** recipe exists, calling user owns recipe\
            **effects** recipe updated to contain item with set amoung, price of recipe updates appropriately\
    update (recipe: Recipe, instructions: String)\
    update (recipe: Recipe, servingQuantity: Int)\
    update (recipe: Recipe, dishType: Int)\
    update (recipe: Recipe, name: String)\
            **requires** recipe exists, calling user owns recipe\
            **effects** update the given attribute