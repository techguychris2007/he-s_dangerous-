import type { CodeTask } from '../codeTypes';

export const ML_NEURAL_NETWORKS_TASKS: CodeTask[] = [
  {
    id: 'ml-nn-01',
    title: 'A Perceptron for AND',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Neural Networks',
    prompt:
      'Write perceptron_predict(inputs, weights, bias) that computes the weighted sum of inputs and ' +
      'weights, adds bias, and returns 1 if the result is greater than 0, otherwise 0 — a single ' +
      'perceptron\'s forward pass.',
    starterCode:
      'def perceptron_predict(inputs, weights, bias):\n' +
      '    # TODO: return 1 if (weighted sum of inputs + bias) > 0, else 0\n' +
      '    pass\n',
    hints: [
      'The weighted sum is sum(x * w for x, w in zip(inputs, weights)).',
      'Add bias to that sum before checking the sign.',
      'Return 1 if the total is strictly greater than 0, otherwise 0.',
    ],
    solution:
      'def perceptron_predict(inputs, weights, bias):\n' +
      '    total = sum(x * w for x, w in zip(inputs, weights)) + bias\n' +
      '    return 1 if total > 0 else 0\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '# weights/bias chosen so this perceptron implements logical AND\n' +
      'w, b = [1, 1], -1.5\n' +
      '__check__("0 AND 0", perceptron_predict([0, 0], w, b), 0)\n' +
      '__check__("1 AND 0", perceptron_predict([1, 0], w, b), 0)\n' +
      '__check__("0 AND 1", perceptron_predict([0, 1], w, b), 0)\n' +
      '__check__("1 AND 1", perceptron_predict([1, 1], w, b), 1)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nn-02',
    title: 'Activation Functions',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Neural Networks',
    prompt:
      "Write apply_activation(values, kind) that applies an activation function element-wise to a list " +
      "of numbers. Support kind='relu' (max(0, x)), kind='sigmoid' (1 / (1 + e**-x)), and kind='tanh' " +
      '(math.tanh(x)). Return a new list, same length as values.',
    starterCode:
      'import math\n\n' +
      'def apply_activation(values, kind):\n' +
      "    # TODO: apply relu, sigmoid, or tanh to every element, based on kind\n" +
      '    pass\n',
    hints: [
      "For kind == 'relu', each output is max(0, x).",
      "For kind == 'sigmoid', each output is 1 / (1 + math.exp(-x)) — same formula as logistic regression's sigmoid.",
      "For kind == 'tanh', use math.tanh(x) directly. A list comprehension with an if/elif chain (or a dict of functions) covers all three.",
    ],
    solution:
      'import math\n\n' +
      'def apply_activation(values, kind):\n' +
      "    if kind == 'relu':\n" +
      '        return [max(0, x) for x in values]\n' +
      "    if kind == 'sigmoid':\n" +
      '        return [1 / (1 + math.exp(-x)) for x in values]\n' +
      '    return [math.tanh(x) for x in values]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(a - b) < 1e-6 for a, b in zip(actual, expected)) and len(actual) == len(expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "__check__('relu', apply_activation([-2, -0.5, 0, 3], 'relu'), [0, 0, 0, 3])\n" +
      "__check__('sigmoid at 0', apply_activation([0], 'sigmoid'), [0.5])\n" +
      "__check__('tanh at 0', apply_activation([0], 'tanh'), [0.0])\n" +
      "__check__('tanh is bounded', apply_activation([100], 'tanh'), [1.0])\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nn-03',
    title: 'Chain Rule for a Gradient',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Neural Networks',
    prompt:
      'Write chain_rule_gradient(d_loss_d_output, d_output_d_hidden, d_hidden_d_weight) that returns the ' +
      'gradient of the loss with respect to a weight several layers back, by multiplying the three local ' +
      'derivatives together — the chain rule, which is literally all backpropagation does at every step.',
    starterCode:
      'def chain_rule_gradient(d_loss_d_output, d_output_d_hidden, d_hidden_d_weight):\n' +
      '    # TODO: return the product of the three local derivatives\n' +
      '    pass\n',
    hints: [
      'The chain rule for a composed function says the derivatives multiply together.',
      'There is no loop or accumulation needed — just multiply the three arguments.',
      'd_loss_d_output * d_output_d_hidden * d_hidden_d_weight is the entire function body.',
    ],
    solution:
      'def chain_rule_gradient(d_loss_d_output, d_output_d_hidden, d_hidden_d_weight):\n' +
      '    return d_loss_d_output * d_output_d_hidden * d_hidden_d_weight\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-9\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", chain_rule_gradient(2, 3, 4), 24)\n' +
      '__check__("with a negative", chain_rule_gradient(-1, 2, 3), -6)\n' +
      '__check__("zero gradient propagates", chain_rule_gradient(0, 5, 10), 0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nn-04',
    title: 'A 2D Convolution Filter',
    difficulty: 'Hard',
    language: 'python',
    category: 'ML: Neural Networks',
    prompt:
      'Write convolve2d(image, kernel) where image is a 2D list (list of rows) and kernel is a smaller 2D ' +
      'list. Slide kernel over every valid position in image (no padding, stride 1), and at each position ' +
      'return the sum of element-wise products. Return the resulting 2D list of outputs.',
    starterCode:
      'def convolve2d(image, kernel):\n' +
      '    # TODO: slide kernel over image (valid positions only) and return the 2D list of sums\n' +
      '    pass\n',
    hints: [
      'The output has (image_height - kernel_height + 1) rows and (image_width - kernel_width + 1) columns.',
      'For each valid top-left position (i, j) in the image, sum kernel[ki][kj] * image[i+ki][j+kj] over every position in the kernel.',
      'Nested loops: outer two over the valid (i, j) output positions, inner two over the kernel\'s own rows/columns.',
    ],
    solution:
      'def convolve2d(image, kernel):\n' +
      '    kh, kw = len(kernel), len(kernel[0])\n' +
      '    ih, iw = len(image), len(image[0])\n' +
      '    out_h, out_w = ih - kh + 1, iw - kw + 1\n' +
      '    result = []\n' +
      '    for i in range(out_h):\n' +
      '        row = []\n' +
      '        for j in range(out_w):\n' +
      '            total = 0\n' +
      '            for ki in range(kh):\n' +
      '                for kj in range(kw):\n' +
      '                    total += kernel[ki][kj] * image[i + ki][j + kj]\n' +
      '            row.append(total)\n' +
      '        result.append(row)\n' +
      '    return result\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'image = [\n' +
      '    [1, 2, 3],\n' +
      '    [4, 5, 6],\n' +
      '    [7, 8, 9],\n' +
      ']\n' +
      'identity_kernel = [[1]]\n' +
      '__check__("1x1 identity kernel", convolve2d(image, identity_kernel), image)\n\n' +
      'sum_kernel = [[1, 1], [1, 1]]\n' +
      '__check__("2x2 sum kernel", convolve2d(image, sum_kernel), [[12, 16], [24, 28]])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nn-05',
    title: 'One RNN Cell Step',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Neural Networks',
    prompt:
      'Write rnn_step(x, h_prev, w_x, w_h, b) computing one step of a simple RNN cell: ' +
      'tanh(w_x * x + w_h * h_prev + b) — the new hidden state, combining the current input with the ' +
      'hidden state carried over from the previous timestep.',
    starterCode:
      'import math\n\n' +
      'def rnn_step(x, h_prev, w_x, w_h, b):\n' +
      '    # TODO: return tanh(w_x * x + w_h * h_prev + b)\n' +
      '    pass\n',
    hints: [
      'Compute the pre-activation first: z = w_x * x + w_h * h_prev + b.',
      'Then squash it: math.tanh(z).',
      'The whole function is one line once you combine those two steps.',
    ],
    solution:
      'import math\n\n' +
      'def rnn_step(x, h_prev, w_x, w_h, b):\n' +
      '    z = w_x * x + w_h * h_prev + b\n' +
      '    return math.tanh(z)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("zero input and state", rnn_step(0, 0, 1, 1, 0), 0.0)\n' +
      '__check__("basic", rnn_step(1, 0, 0.5, 0.5, 0), math.tanh(0.5))\n' +
      '__check__("with bias", rnn_step(0, 0, 1, 1, 2), math.tanh(2))\n\n' +
      'import math\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-nn-06',
    title: 'Inverted Dropout',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Neural Networks',
    prompt:
      'Write apply_dropout(activations, keep_mask, keep_prob) where keep_mask is a list of 0/1 flags (1 ' +
      'means "keep this unit"). For units where keep_mask is 1, return activation / keep_prob (scaling up ' +
      'to compensate for the dropped units); for units where keep_mask is 0, return 0. This "inverted ' +
      'dropout" scaling means no extra rescaling is needed at inference time.',
    starterCode:
      'def apply_dropout(activations, keep_mask, keep_prob):\n' +
      '    # TODO: scale kept activations by 1/keep_prob, zero out dropped ones\n' +
      '    pass\n',
    hints: [
      'Walk activations and keep_mask together with zip.',
      'When the mask is 1, the output is the activation divided by keep_prob.',
      'When the mask is 0, the output is exactly 0 regardless of the original activation.',
    ],
    solution:
      'def apply_dropout(activations, keep_mask, keep_prob):\n' +
      '    return [(a / keep_prob if m == 1 else 0) for a, m in zip(activations, keep_mask)]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(a - b) < 1e-6 for a, b in zip(actual, expected)) and len(actual) == len(expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", apply_dropout([1, 2, 3, 4], [1, 0, 1, 0], 0.5), [2.0, 0, 6.0, 0])\n' +
      '__check__("keep everything", apply_dropout([1, 2], [1, 1], 1.0), [1.0, 2.0])\n' +
      '__check__("drop everything", apply_dropout([5, 5], [0, 0], 0.5), [0, 0])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
