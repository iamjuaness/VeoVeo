import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  selectedAvatar: string;
  moviesWatched: { movieId: string, count: number, duration: number }[];
  watchLater: string[];
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  selectedAvatar: { type: String, required: false },
    moviesWatched: [
    {
      movieId: { type: String, required: true },
      count: { type: Number, default: 1 },
      duration: { type: Number, required: true }
    }
  ],
  watchLater: [String]
});

export default model<IUser>('User', userSchema);
