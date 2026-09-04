# RoBERTa 分类模型评测约定

这套评测工具用于固定 Accuracy、Macro-F1 以及优化前后提升百分比的口径。它不生成或猜测模型结果；结果必须来自同一 hold-out 测试集上的真实预测文件。

## 预测文件格式

支持 JSON、JSONL 和 CSV。每条记录至少包含：

```json
{"id": "q-001", "label": "class_a", "prediction": "class_b"}
```

`id` 必须在 baseline 与 candidate 文件中一致。缺失的类别也会被计入 Macro-F1，避免只报告表现较好的类别。

## 运行

```powershell
python backend/scripts/roberta_eval.py evaluate predictions.json `
  --output artifacts/roberta/evaluate.json

python backend/scripts/roberta_eval.py compare baseline.json candidate.json `
  --output artifacts/roberta/compare.json
```

`compare` 会输出 Accuracy 与 Macro-F1 的：

- baseline 和 candidate 原始值；
- 绝对提升（百分点）；
- 相对提升比例；
- 10,000 次配对 bootstrap 的 95% 置信区间。

相对提升的定义为：

```text
(candidate - baseline) / baseline
```

简历中优先写百分点，例如 `Accuracy 0.73→0.85（+12 个百分点）`；只有在测试集、随机种子和置信区间都固定后，才写相对提升百分比。

## 线上验证

离线测试集不得参与线上调参。线上至少记录请求量、预测标签、人工/规则校验标签、版本号和 P95 延迟，并按模型版本计算 Accuracy、Macro-F1 和错误率。线上灰度结果与离线结果分开报告。
