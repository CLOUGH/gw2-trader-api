import app from "../src/app";
import { ItemService } from "../src/services/Items.service";
import Item from "../src/models/Item.model";

describe("ItemService", () => {
    it("should initializable", () => {
        const itemService = new ItemService();
        expect(itemService).toBeInstanceOf(ItemService);
    });

    describe("batchItems", () => {
        beforeEach(() => {

        });

        it("should return a array", () => {
            const itemService = new ItemService();

            const batches = itemService.batchItems([], 1);
            expect(batches).toEqual([]);
        });

        it("should split a array into arrays", () => {
            const itemService = new ItemService();
            const batches = itemService.batchItems([1, 2, 3, 4, 5, 6, 7], 2);
            expect(batches).toEqual([[1, 2], [3, 4], [5, 6], [7]]);
        });

        it("passing a invalid size should return a empty array", () => {
            const itemService = new ItemService();
            expect(itemService.batchItems([1, 2, 3], 0)).toEqual([]);

            expect(itemService.batchItems([1, 2, 3], -1)).toEqual([]);

        });
    });
});
