import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  moviesWatched: { movieId: string, count: number, duration: number }[];
  watchLater: string[]; // Solo los ids
}

const movieSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  moviesWatched: [
    {
      movieId: { type: String, required: true },
      count: { type: Number, default: 1 },
      duration: { type: Number, required: true }
    }
  ],
  watchLater: [String]
});

export default model<IUser>('User', movieSchema);
