"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return (await this.model.create(data, options));
    }
    async find({ filter, projection, options, }) {
        let doc = this.model.find(filter, projection, options);
        if (options?.populate) {
            doc = doc.populate(options.populate);
        }
        if (options?.lean) {
            return (await doc.lean());
        }
        return (await doc);
    }
    async findOne({ filter, projection, options, }) {
        let doc = this.model.findOne(filter, projection, options);
        if (options?.populate) {
            doc = doc.populate(options.populate);
        }
        if (options?.lean) {
            return (await doc.lean());
        }
        return (await doc);
    }
    async update({ filter, update, options, many = false, }) {
        if (many) {
            return (await this.model.updateMany(filter, update, options));
        }
        return (await this.model.updateOne(filter, update, options));
    }
    async delete({ filter, options, many = false, }) {
        if (many) {
            return await this.model.deleteMany(filter, options);
        }
        return await this.model.deleteOne(filter, options);
    }
    async findById({ id, projection, options, }) {
        let doc = this.model.findById(id, projection, options);
        if (options?.populate) {
            doc = doc.populate(options.populate);
        }
        if (options?.lean) {
            return (await doc.lean());
        }
        return (await doc);
    }
    async findOneAndUpdate({ filter, update, options, }) {
        let doc = this.model.findOneAndUpdate(filter, update, options);
        if (options?.populate) {
            doc = doc.populate(options.populate);
        }
        if (options?.lean) {
            return (await doc.lean());
        }
        return (await doc);
    }
    async findOneAndDelete({ filter, options, }) {
        let doc = this.model.findOneAndDelete(filter, options);
        if (options?.populate) {
            doc = doc.populate(options.populate);
        }
        if (options?.lean) {
            return (await doc.lean());
        }
        return (await doc);
    }
    async updateMany({ filter, update, options, }) {
        return (await this.model.updateMany(filter, update, options));
    }
    async deleteMany({ filter, options, }) {
        return await this.model.deleteMany(filter, options);
    }
}
exports.DatabaseRepository = DatabaseRepository;
