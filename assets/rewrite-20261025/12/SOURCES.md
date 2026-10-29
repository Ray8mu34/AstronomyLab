# 恒星的能量与演化：补充来源

本轮于2026-10-25查阅。原图、原有资料和许可继续见 [v0.2来源记录](../../v02-batch-C-SOURCES.md)。以下仅记录本次增加的论述依据；正文中的数值算例为按明示参数计算。

<a id="stellar-structure"></a>

## 恒星结构与能量守恒

- Onno Pols, *Stellar Structure and Evolution*, Utrecht University MSc lecture notes：[作者课程入口](https://www.astro.ru.nl/~onnop/education/stev_utrecht_notes/)、[第1—4章](https://www.astro.ru.nl/~onnop/education/stev_utrecht_notes/chapter1-4.pdf)。查阅静力平衡、维里关系、总能量与局部能量守恒相关部分；用于说明理想气体主导且表面压力可忽略的整个星体的收缩升温。正文包层另用局部第一定律说明，不把整个球体的维里等式直接套给独立包层。

<a id="giant-envelope"></a>

## 核心、氢壳层与红巨星包层

- Onno Pols，同上，[第9—11章](https://www.astro.ru.nl/~onnop/education/stev_utrecht_notes/chapter9-11.pdf)。实际读第10章相关部分，尤其印刷页143的核心—包层响应、147—149页低质量星亚巨星/红巨星演化、简并核心质量—光度关系及 Hayashi 线附近的外部条件。支持太阳类星可在近热平衡下缓慢扩大、壳层与致密核心的联系、深对流及光球条件约束有效温度。
- Hekker, Angelou, Elsworth & Basu (2020), *Mirror principle and the red-giant bump: the battle of entropy in low-mass stars*, MNRAS 492, 5940–5948：[全文](https://arxiv.org/pdf/2001.06064)。实际读§2—4的比熵、局部能量方程与内外层收缩/膨胀描述。用于逐层能量和做功的解释；未复现 MESA 计算，未在正文加入论文的红巨星 bump 分析。
- Stancliffe et al. (2009), *Why do low-mass stars become red giants?*：[原文](https://arxiv.org/pdf/0902.0406)。读摘要、引言和数值实验的问题设置，检查平均分子量变化与供能不能单独构成所有质量恒星的统一解释。正文选择太阳类星，结合结构、成分、供能与输运进行解释。
- OpenStax, *Astronomy 2e*, [§22.1](https://openstax.org/books/astronomy-2e/pages/22-1-evolution-from-the-main-sequence-to-red-giants)。重新读主序组成变化、壳层氢燃烧及红巨星描述，保留已有基础来源。

## 新图

[core-envelope.svg](core-envelope.svg) 为原创结构示意，生成源 [make_figures.py](make_figures.py)。圆的半径、各层厚度与箭头长度为教学示意；无数值恒星模型数据。原有猎户座、Gaia赫罗图、环状星云文件未改。
