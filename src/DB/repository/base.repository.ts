import {
  AnyKeys,
  CreateOptions,
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateResult,
} from "mongoose";
import { IUser } from "../../common/interfaces";

interface FindOptions<TRawDoc> extends QueryOptions<TRawDoc> {
  lean?: boolean;
  populate?: PopulateOptions | PopulateOptions[] | string;
}

export abstract class DatabaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<IUser>) {}

  // _____CREATE_____
  async create({
    data,
  }: {
    data: AnyKeys<TRawDoc>[];
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>[] | AnyKeys<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[] | HydratedDocument<TRawDoc>> {
    return (await this.model.create(data as any, options)) as any;
  }

  //_____FIND_____

  // Overload 1: with lean: true → returns plain objects
  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options: FindOptions<TRawDoc> & { lean: true };
  }): Promise<TRawDoc[]>;

  // Overload 2: without lean → returns hydrated documents
  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  // Implementation
  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<TRawDoc[] | HydratedDocument<TRawDoc>[]> {
    let doc = this.model.find(filter as any, projection, options);

    if (options?.populate) {
      doc = doc.populate(options.populate as any);
    }

    if (options?.lean) {
      return (await doc.lean()) as TRawDoc[];
    }

    return (await doc) as any;
  }

  //_____FIND ONE_____

  // Overload 1: with lean: true → returns plain object or null
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options: FindOptions<TRawDoc> & { lean: true };
  }): Promise<TRawDoc | null>;

  // Overload 2: without lean → returns hydrated document or null
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  // Implementation
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<TRawDoc | HydratedDocument<TRawDoc> | null> {
    let doc = this.model.findOne(filter as any, projection, options);

    if (options?.populate) {
      doc = doc.populate(options.populate as any);
    }

    if (options?.lean) {
      return (await doc.lean()) as TRawDoc | null;
    }

    return (await doc) as any;
  }

  //______UPDATE______

  // Overload 1: updateOne (many is false or not provided)
  async update({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TRawDoc>;
    many?: false;
  }): Promise<UpdateResult>;

  // Overload 2: updateMany (many is true)
  async update({
    filter,
    update,
    options,
    many,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TRawDoc>;
    many: true;
  }): Promise<UpdateResult>;

  // Implementation
  async update({
    filter,
    update,
    options,
    many = false,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TRawDoc>;
    many?: boolean;
  }): Promise<UpdateResult> {
    if (many) {
      return (await this.model.updateMany(
        filter as any,
        update as any,
        options as any
      )) as UpdateResult;
    }

    return (await this.model.updateOne(
      filter as any,
      update as any,
      options as any
    )) as UpdateResult;
  }

  //____DELETE____

  // Overload 1: deleteOne (many is false or not provided)
  async delete({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
    many?: false;
  }): Promise<{ deletedCount: number }>;

  // Overload 2: deleteMany (many is true)
  async delete({
    filter,
    options,
    many,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
    many: true;
  }): Promise<{ deletedCount: number }>;

  // Implementation
  async delete({
    filter,
    options,
    many = false,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
    many?: boolean;
  }): Promise<{ deletedCount: number }> {
    if (many) {
      return await this.model.deleteMany(filter as any, options as any);
    }

    return await this.model.deleteOne(filter as any, options as any);
  }

  //_____FIND BY ID_____

  // Overload 1: with lean: true → returns plain object or null
  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDoc>;
    options: FindOptions<TRawDoc> & { lean: true };
  }): Promise<TRawDoc | null>;

  // Overload 2: without lean → returns hydrated document or null
  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  // Implementation
  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<TRawDoc | HydratedDocument<TRawDoc> | null> {
    let doc = this.model.findById(id, projection, options);

    if (options?.populate) {
      doc = doc.populate(options.populate as any);
    }

    if (options?.lean) {
      return (await doc.lean()) as TRawDoc | null;
    }

    return (await doc) as any;
  }

  //_____FIND ONE AND UPDATE_____

  // Overload 1: with lean: true → returns plain object or null
  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options: FindOptions<TRawDoc> & { lean: true };
  }): Promise<TRawDoc | null>;

  // Overload 2: without lean → returns hydrated document or null
  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  // Implementation
  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<TRawDoc | HydratedDocument<TRawDoc> | null> {
    let doc = this.model.findOneAndUpdate(
      filter as any,
      update as any,
      options as any
    );

    if (options?.populate) {
      doc = doc.populate(options.populate as any);
    }

    if (options?.lean) {
      return (await doc.lean()) as TRawDoc | null;
    }

    return (await doc) as any;
  }

  //_____FIND ONE AND DELETE_____

  // Overload 1: with lean: true → returns plain object or null
  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options: FindOptions<TRawDoc> & { lean: true };
  }): Promise<TRawDoc | null>;

  // Overload 2: without lean → returns hydrated document or null
  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  // Implementation
  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: FindOptions<TRawDoc>;
  }): Promise<TRawDoc | HydratedDocument<TRawDoc> | null> {
    let doc = this.model.findOneAndDelete(filter as any, options as any);

    if (options?.populate) {
      doc = doc.populate(options.populate as any);
    }

    if (options?.lean) {
      return (await doc.lean()) as TRawDoc | null;
    }

    return (await doc) as any;
  }

  //_____UPDATE MANY_____

  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TRawDoc>;
  }): Promise<UpdateResult> {
    return (await this.model.updateMany(
      filter as any,
      update as any,
      options as any
    )) as UpdateResult;
  }

  //_____DELETE MANY_____

  async deleteMany({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<{ deletedCount: number }> {
    return await this.model.deleteMany(filter as any, options as any);
  }
}
