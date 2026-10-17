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
        body: `<p>A perceptron is a binary decision rule built from a weighted sum. For input features
        <code>x = (x₁, …, xₚ)</code>, weights <code>w = (w₁, …, wₚ)</code>, and bias <code>b</code>, it first
        calculates <code>z = w₁x₁ + … + wₚxₚ + b</code>, or compactly <code>w·x + b</code>. Each weight says
        how strongly and in which direction a feature changes the score; the bias shifts the decision
        boundary even when all features are zero.</p><p>The step activation converts that score into a class: predict 1
        when z is greater than or equal to zero, otherwise predict 0. For example, with w=[2,−1] and
        b=−0.5, x=[1,0] gives z=1.5 and class 1, while x=[0,1] gives z=−1.5 and class 0. The rule returns
        a class directly, not a probability or confidence. It is a linear classifier because the boundary
        <code>w·x+b=0</code> is a straight line in two dimensions and a hyperplane in more dimensions.</p>`,
      },
      {
        heading: 'What it can and can\'t learn',
        body: `<p>The perceptron succeeds when one straight boundary can separate all positive examples
        from all negative examples. With binary inputs, AND has one positive point [1,1] and three
        negative points; a line can isolate that corner. OR has one negative point [0,0] and three
        positive points; a line can isolate that corner too. A NOT gate has only one input and is
        separated by a threshold on that input.</p><p>XOR labels [0,0] and [1,1] as 0, and [0,1] and
        [1,0] as 1. On a plane, the two positive points sit on opposite corners, with negative points
        between them. Any straight line that puts one positive corner on one side puts the other positive
        corner on the wrong side. No choice of perceptron weights fixes this because the limitation is
        representational, not a poor training run. Always distinguish “the optimizer did not find a
        solution” from “the model family cannot represent one.”</p>`,
      },
      {
        heading: 'From one neuron to a network',
        body: `<p>A multi-layer perceptron composes affine transformations with nonlinear activations.
        A hidden layer can create intermediate features; a later layer combines them into the final
        score. For XOR, one hidden unit can respond to “at least one input is on” while another responds
        to “both inputs are on”; an output unit can combine those signals so exactly-one-input cases
        become positive. Training learns these intermediate boundaries from data.</p><p>Modern networks
        usually use differentiable activations such as ReLU or tanh in hidden layers because gradients
        can guide weight updates. A hard step has derivative zero almost everywhere, so ordinary gradient
        descent cannot train it effectively. A hidden layer does not guarantee a useful solution: the
        network still needs suitable data, loss, initialization, and optimization. It also introduces more
        parameters and can overfit, so compare it against a simple baseline and inspect held-out performance.</p>`,
      },
      {
        heading: 'Worked example: a perceptron for AND',
        body: `<p>Let x₁ and x₂ be binary inputs and choose w=[1,1], b=−1.5. For [0,0], z=0+0−1.5=−1.5,
        so the output is 0. For [1,0], z=1+0−1.5=−0.5, so the output is 0. For [0,1], z=0+1−1.5=−0.5,
        so the output is 0. For [1,1], z=1+1−1.5=0.5, so the output is 1. These four calculations
        reproduce the AND truth table.</p><p>The bias controls the threshold: with positive unit weights, the
        total input must reach at least 1.5. If the prediction rule uses z≥0, equality is positive; if it
        uses z&gt;0, equality is negative. State that convention because it changes boundary cases. The lab
        asks you to implement the score and threshold, then test all four inputs and verify that a correct
        result comes from the complete truth table, not a single example.</p>`,
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
      {
        heading: 'Worked example: ReLU vs. sigmoid on the same input',
        body: `<p>For a pre-activation value z = -2: ReLU outputs max(0, -2) = 0 — the neuron is fully "off"
        and passes nothing forward. Sigmoid outputs 1/(1+e&sup2;) &asymp; 0.119 — small, but never exactly
        zero. For z = 3: ReLU outputs 3 directly (no saturation), while sigmoid outputs &sigma;(3) &asymp;
        0.953 — already close to its ceiling of 1, meaning further increases in z barely change the output
        anymore. This saturation-at-large-|z| behavior is exactly why ReLU became the default for deep
        networks.</p>`,
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
      {
        heading: 'Worked example: chaining three derivatives',
        body: `<p>If the loss changes by 2 units per unit change in the output (&part;loss/&part;output=2),
        the output changes by 3 units per unit change in a hidden neuron (&part;output/&part;hidden=3), and
        that hidden neuron changes by 4 units per unit change in one weight (&part;hidden/&part;weight=4),
        the chain rule multiplies all three: 2&times;3&times;4=24 — the gradient of the loss with respect
        to that one weight, several layers back. This single multiplication, repeated for every weight in
        the network, is exactly what the coding challenge below asks you to compute.</p>`,
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
      {
        heading: 'Worked example: a 2&times;2 filter by hand',
        body: `<p>A 3&times;3 image [[1,2,3],[4,5,6],[7,8,9]] convolved with the 2&times;2 "sum" filter
        [[1,1],[1,1]] at the top-left position covers [[1,2],[4,5]], summing to 1+2+4+5=12. Sliding one
        step right covers [[2,3],[5,6]], summing to 16. The filter never leaves the image, so a 3&times;3
        input with a 2&times;2 filter produces a 2&times;2 output — exactly the shrinking-output-size
        arithmetic the convolution coding challenge below implements in full.</p>`,
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
      {
        heading: 'Worked example: one hidden-state update',
        body: `<p>With input x=1, previous hidden state h=0, and weights w_x=0.5, w_h=0.5, bias=0: the new
        hidden state is tanh(0.5&times;1 + 0.5&times;0 + 0) = tanh(0.5) &asymp; 0.462. Feed that same weight
        set a second input x=1 with the new h=0.462: tanh(0.5 + 0.5&times;0.462) &asymp; tanh(0.731) &asymp;
        0.624 — the hidden state keeps accumulating influence from every step seen so far, which is exactly
        the update the rnn_step coding challenge below computes one timestep at a time.</p>`,
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
      {
        heading: 'Worked example: inverted dropout scaling',
        body: `<p>With activations [1,2,3,4] and a 50% keep probability, dropout might zero out the 2nd and
        4th units: kept units are then scaled by 1/0.5=2 to compensate — giving [2,0,6,0] instead of
        [1,0,3,0]. That doubling matters: without it, the expected total signal reaching the next layer
        during training (half-scale, half the units) would be systematically smaller than at inference time
        (full scale, all units) — exactly the mismatch inverted dropout, implemented in the coding challenge
        below, is designed to avoid.</p>`,
      },
    ],
  },
  {
    id: 'attention-transformers',
    title: 'Self-Attention and Transformer Models',
    source: 'Dive into Deep Learning · Deep Learning with Python',
    unit: 'neural-networks',
    challengeTaskId: 'ml-nn-07',
    sections: [
      {
        heading: 'Why attention changed sequence modeling',
        body: `<p>An RNN carries information step by step, so a long-range relationship must travel through many updates. Self-attention lets each token compare itself directly with the other tokens in the same sequence. In “the animal did not cross because it was tired,” a model can relate “it” to “animal” without compressing the entire sentence into one recurrent state.</p><p>A transformer is built from attention and feed-forward layers. It does not inherently know word order, so it adds positional information to token representations. Encoder-style models build contextual representations of an input; decoder-style models predict the next token; encoder-decoder models transform an input sequence into an output sequence.</p>` ,
      },
      {
        heading: 'Queries, keys, and values',
        body: `<p>Each input representation is projected into a query, key, and value. A query asks what information is useful at this position. Keys describe what each position offers, and values carry the information to combine. The scaled dot-product attention calculation is <code>softmax(QKᵀ / √dₖ)V</code>. The dot product measures compatibility; dividing by the square root of key width keeps scores from growing too large; softmax turns scores into weights that sum to one; and the weighted values create a context-aware representation.</p><p>For one query with scores [2, 1, 0], softmax assigns the largest weight to the first key. The result is a weighted average, not a hard selection. Attention masks can exclude padding tokens or, in autoregressive generation, future positions. A row with every key masked is invalid and must be handled explicitly.</p>` ,
      },
      {
        heading: 'A small, runnable attention implementation',
        body: `<p>This pure-Python exercise uses short vectors to expose the operation. Real implementations use matrix multiplication on accelerators, multiple heads, batched tensors, and fused kernels; the code below is for understanding, not production speed.</p><pre><code>import math

def softmax(values):
    peak = max(values)
    exponentials = [math.exp(value - peak) for value in values]
    total = sum(exponentials)
    return [value / total for value in exponentials]

def attend(query, keys, values, key_mask=None):
    width = len(query)
    scores = [sum(q * k for q, k in zip(query, key)) / math.sqrt(width)
              for key in keys]
    allowed = key_mask or [True] * len(keys)
    if len(allowed) != len(keys) or not any(allowed):
        raise ValueError("at least one key must be available")
    selected = [i for i, is_allowed in enumerate(allowed) if is_allowed]
    weights = softmax([scores[i] for i in selected])
    return [sum(weight * values[i][column]
                for weight, i in zip(weights, selected))
            for column in range(len(values[0]))]</code></pre><p>The softmax subtracts its largest score before exponentiation. This leaves the mathematical result unchanged while reducing overflow risk. The lab asks you to implement and test this pattern, including masks and malformed shapes.</p>` ,
      },
      {
        heading: 'Multi-head attention and positional information',
        body: `<p>One attention head may focus on nearby words while another focuses on agreement, entities, or longer-range context. Multi-head attention learns separate query/key/value projections, applies attention in parallel, concatenates the head outputs, and projects them back to the model width. Residual connections and normalization help deep stacks train reliably. Feed-forward blocks then transform each position independently after contextual mixing.</p><p>Position can be represented with fixed sinusoidal values or learned embeddings. A causal mask prevents a decoder position from seeing tokens that come later in the target. Without that mask during next-token training, the model could cheat by reading the answer it is supposed to predict.</p>` ,
      },
      {
        heading: 'Pretraining, fine-tuning, and evaluation',
        body: `<p>Large transformer models are usually pretrained on broad data with a self-supervised objective, then adapted for a task. Fine-tuning updates some or all parameters with task data; parameter-efficient methods update smaller adapter components. A pretrained model can reduce data and compute needs, but it does not remove the need for clean splits, a relevant evaluation set, privacy review, bias checks, and misuse analysis.</p><p>For text generation, evaluate more than fluency. Check factuality, refusal behavior where relevant, robustness to input variation, latency, cost, and task-specific success. Keep prompts, model versions, tokenization, decoding parameters, and evaluation data versioned so a result can be reproduced. Treat generated text as model output, not ground truth.</p>` ,
      },
    ],
  },
];
