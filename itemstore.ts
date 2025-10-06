export interface Item {
    name: string;
    price: number;
    quantity: number;
    units: string;
    store: string;
    confirmed: boolean;
}

export class ItemStore {
    private items: Item[] = [];

    /**
     * Enters a new, unconfirmed item into the store.
     * @param name The name of the item.
     * @param price The price of the item.
     * @param quantity The quantity of the item.
     * @param units The unit of measurement for the quantity.
     * @param store The store where the item can be purchased.
     * @returns The newly created, unconfirmed item.
     */
    enter(name: string, price: number, quantity: number, units: string, store: string): Item {
        if (this.findItemByName(name)) {
            throw new Error(`Item with name "${name}" already exists.`);
        }

        const newItem: Item = {
            name,
            price,
            quantity,
            units,
            store,
            confirmed: false,
        };

        this.items.push(newItem);
        return newItem;
    }

    /**
     * Confirms an existing item, optionally updating its properties.
     * This action would typically be restricted to Administrators.
     * @param name The name of the item to confirm.
     * @returns The confirmed item.
     */
    confirm(name: string): Item {
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
     * Updates the properties of an existing item.
     * This action would typically be restricted to Administrators.
     * @param name The name of the item to update.
     * @param updates An object containing the fields to update.
     * @returns The updated item.
     */
    update(name: string, updates: Partial<Omit<Item, 'name' | 'confirmed'>>): Item {
        const item = this.findItemByName(name);
        if (!item) {
            throw new Error(`Item with name "${name}" not found.`);
        }

        // Apply updates
        Object.assign(item, updates);
        return item;
    }

    /**
     * Helper to find an item by its name.
     */
    private findItemByName(name: string): Item | undefined {
        return this.items.find(item => item.name.toLowerCase() === name.toLowerCase());
    }

    /**
     * Displays all items in the store.
     */
    displayItems(): void {
        console.log('\n🛒 ItemStore Items');
        console.log('===================');
        if (this.items.length === 0) {
            console.log('No items have been entered yet.');
            return;
        }
        this.items.forEach(item => {
            const confirmedStatus = item.confirmed ? '✅ Confirmed' : '⏳ Unconfirmed';
            console.log(`\n- ${item.name} [${confirmedStatus}]`);
            console.log(`  Price: $${item.price.toFixed(2)}`);
            console.log(`  Amount: ${item.quantity} ${item.units}`);
            console.log(`  Store: ${item.store}`);
        });
    }
}

