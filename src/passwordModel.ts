import * as tf from '@tensorflow/tfjs';

let model: tf.Sequential | null = null;

// Function to create and train the model
export const initializeModel = async () => {
  model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });

  const xs = tf.tensor2d([
    [8, 1, 1, 1, 1],  // Strong password
    [4, 1, 0, 0, 0],  // Weak password
    [12, 1, 1, 1, 0], // Moderate password
    [16, 1, 1, 1, 1], // Very strong password
    [6, 1, 1, 0, 0],  // Weak password
  ]);
  const ys = tf.tensor2d([[0.9], [0.2], [0.6], [1.0], [0.3]]);

  await model.fit(xs, ys, { epochs: 100 });
};

// Function to predict password strength
export const predictStrength = async (
  length: number,
  hasLower: boolean,
  hasUpper: boolean,
  hasDigit: boolean,
  hasSpecial: boolean
): Promise<number> => {
  if (!model) {
    throw new Error('Model not initialized');
  }

  const input = tf.tensor2d([[
    length,
    hasLower ? 1 : 0,
    hasUpper ? 1 : 0,
    hasDigit ? 1 : 0,
    hasSpecial ? 1 : 0,
  ]]);

  const prediction = model.predict(input) as tf.Tensor;
  const result = prediction.dataSync()[0];
  
  // Clean up tensors
  input.dispose();
  prediction.dispose();

  return result;
};