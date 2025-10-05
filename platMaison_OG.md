
# PlatMaison (Original)

**concept** PlatMaison [Item, User]

**purpose** grouping of necessary items to make a particular dish

**principle** A user would like to make a certain dish and needs the ingredients to make it. In order to purchase said ingredients they *create* a dish and then *updateIngredient* to add/update/remove ingredients as needed. They are able to *update* the attibutes to their recipe as needed afterwards as well.

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