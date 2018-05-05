import mongoose from 'mongoose';


const itemSchema = new mongoose.Schema({
    any: mongoose.Schema.Types.Mixed
});

const Item = mongoose.model("Item", itemSchema);
export default Item;