import type { MlLesson } from './types';

export const NEURAL_NETWORKS_LESSONS: MlLesson[] = [
  {
    id: 'perceptron',
    title: 'The Perceptron',
    source: 'Extension',
    unit: 'neural-networks',
    challengeTaskId: 'ml-nn-01',
    sections: [
      {
        heading: 'The simplest possible neural network',
        body: `<p>A perceptron computes a weighted sum of its inputs, adds a bias, and passes the result
        through a step function: output 1 if the sum is positive, 0 otherwise. It's a linear classifier —
        structurally, it's logistic regression with a hard threshold instead of a smooth sigmoid.</p>`,
      },
      {
        heading: 'What it can and can\'t learn',
        body: `<p>A single perceptron can only separate data with a straight line (or hyperplane) — it can
        learn AND, OR, and NOT, but famously <em>cannot</em> learn XOR, since no single straight line
        separates XOR's outputs. This limitation is exactly why deeper networks exist.</p>`,
      },
      {
        heading: 'From one neuron to a network',
        body: `<p>Stacking perceptron-like units into layers, with a smooth (differentiable) activation
        function instead of a hard step, is what turns "a single linear classifier" into a
        <strong>multi-layer perceptron</strong> capable of learning nonlinear boundaries like XOR.</p>`,
      },
    ],
  },
  {
    id: 'mlp-activation-functions',
    title: 'Multi-Layer Perceptrons &amp; Activation Functions',
    source: 'Extension',
    unit: 'neural-networks',
    challengeTaskId: 'ml-nn-02',
    sections: [
      {
        heading: 'Why nonlinearity is the whole point',
        body: `<p>Stacking linear layers with no nonlinearity between them collapses mathematically into a
        single linear layer — depth adds nothing without a nonlinear <strong>activation function</strong>
        applied between layers. That nonlinearity is what lets a deep network approximate curved,
        complex decision boundaries.</p>`,
      },
      {
        heading: 'Common activation functions',
        body: `<ul>
          <li><strong>Sigmoid</strong> — squashes to (0, 1); saturates and slows learning for large |z|.</li>
          <li><strong>Tanh</strong> — squashes to (-1, 1); zero-centered, still saturates.</li>
          <li><strong>ReLU</strong> — max(0, z); the modern default. Cheap to compute and doesn't saturate for
          positive inputs, though it can "die" (always output 0) if a neuron's weights push it permanently negative.</li>
        </ul>`,
      },
      {
        heading: 'The forward pass',
        body: `<p>A prediction flows forward layer by layer: each layer computes weights &middot; inputs +
        bias, applies its activation function, and passes the result to the next layer — the same
        "multiply then sum" as linear regression, just repeated and made nonlinear at every layer.</p>`,
      },
    ],
  },
  {
    id: 'backpropagation',
    title: 'Backpropagation',
    source: 'Extension',
    unit: 'neural-networks',
    challengeTaskId: 'ml-nn-03',
    sections: [
      {
        heading: 'Gradient descent, for every layer at once',
        body: `<p>Training a neural network still means gradient descent — but now the loss depends on
        every weight in every layer through a long chain of function compositions.
        <strong>Backpropagation</strong> is the efficient algorithm for computing all of those gradients at
        once using the chain rule.</p>`,
      },
      {
        heading: 'The chain rule, applied backward',
        body: `<p>Starting from the loss at the output layer, backprop computes how much each layer's output
        contributed to the error, then propagates that "blame" backward layer by layer, computing the
        gradient for every weight along the way — hence "back"-propagation.</p>`,
      },
      {
        heading: 'Why this made deep learning practical',
        body: `<p>Before backprop's efficient chain-rule formulation was popularized, training multi-layer
        networks was computationally prohibitive. Combined with GPUs (which parallelize the matrix math
        involved) and large datasets, it's the algorithm underlying essentially all of modern deep
        learning.</p>`,
      },
    ],
  },
  {
    id: 'cnn-intro',
    title: 'Convolutional Neural Networks',
    source: 'Extension',
    unit: 'neural-networks',
    challengeTaskId: 'ml-nn-04',
    sections: [
      {
        heading: 'Why not just flatten an image?',
        body: `<p>A fully-connected network treating every pixel as an independent input ignores that
        nearby pixels are related, and has an enormous number of weights for any realistically sized image.
        <strong>Convolutional layers</strong> exploit spatial structure directly.</p>`,
      },
      {
        heading: 'The convolution operation',
        body: `<p>A small <strong>filter</strong> (e.g. 3&times;3 weights) slides across the image, computing
        a weighted sum at each position — the same filter, reused at every location. This gives two big
        wins: far fewer parameters than a fully-connected layer, and the same feature (an edge, a texture)
        gets detected no matter where in the image it appears.</p>`,
      },
      {
        heading: 'Layers build on layers',
        body: `<p>Early convolutional layers learn simple features like edges and color blobs; deeper layers
        combine those into increasingly complex patterns — textures, shapes, eventually whole object parts —
        which is why CNNs are the standard architecture for image classification, detection, and segmentation.</p>`,
      },
    ],
  },
  {
    id: 'rnn-intro',
    title: 'Recurrent Neural Networks &amp; Sequences',
    source: 'Extension',
    unit: 'neural-networks',
    challengeTaskId: 'ml-nn-05',
    sections: [
      {
        heading: 'Data where order matters',
        body: `<p>Text, audio, and time series all share a property CNNs and plain MLPs don't handle well:
        the input is a sequence, and what comes at each step depends on what came before.
        <strong>Recurrent Neural Networks</strong> (RNNs) are built specifically for this.</p>`,
      },
      {
        heading: 'The recurrent idea',
        body: `<p>An RNN maintains a <strong>hidden state</strong> that gets updated at every step of the
        sequence, combining the new input with everything the state has accumulated so far — the same
        weights are reused at every timestep, letting the network handle sequences of any length.</p>`,
      },
      {
        heading: 'The long-range dependency problem',
        body: `<p>Plain RNNs struggle to remember information from many steps earlier (the gradient signal
        fades over long sequences — the "vanishing gradient" problem). Architectures like <strong>LSTM</strong>
        and <strong>GRU</strong> add gating mechanisms specifically designed to preserve important
        information over longer sequences, and remain a common choice for sequence tasks even in the
        transformer era.</p>`,
      },
    ],
  },
  {
    id: 'training-deep-networks',
    title: 'Training Deep Networks: Regularization &amp; Dropout',
    source: 'Extension',
    unit: 'neural-networks',
    challengeTaskId: 'ml-nn-06',
    sections: [
      {
        heading: 'Deep networks overfit easily',
        body: `<p>With enough layers and neurons, a network can have millions of parameters — more than
        enough to memorize a training set outright. Every regularization idea from earlier units (L2
        penalties, more data, simpler architectures) still applies, plus a few techniques specific to
        neural networks.</p>`,
      },
      {
        heading: 'Dropout',
        body: `<p><strong>Dropout</strong> randomly disables a fraction of neurons on each training step,
        forcing the network to not rely too heavily on any single neuron or narrow path through the
        network. At inference time, dropout is turned off and the full network is used.</p>`,
      },
      {
        heading: 'Batch normalization and early stopping',
        body: `<p><strong>Batch normalization</strong> re-scales each layer's inputs during training,
        stabilizing and speeding up convergence. <strong>Early stopping</strong> — halting training once
        validation performance stops improving, even if training loss keeps dropping — is often the
        simplest and most effective regularizer of all.</p>`,
      },
    ],
  },
];
