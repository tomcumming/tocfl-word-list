use std::io::Read;

use jieba_rs::Jieba;
use unicode_segmentation::UnicodeSegmentation;

fn split_on_comma_etc(sentence: &str) -> Vec<&str> {
    sentence.split(",").flat_map(|s| s.split("，")).collect()
}

fn main() -> std::io::Result<()> {
    let jieba = Jieba::new();

    let contents = {
        let mut buffer = String::new();
        std::io::stdin().read_to_string(&mut buffer)?;
        buffer
    };

    let sentence_parts =
        UnicodeSegmentation::unicode_sentences(contents.as_str()).flat_map(split_on_comma_etc);

    for sentence in sentence_parts {
        let words: Vec<_> = jieba
            .cut(sentence, true)
            .iter()
            .filter(|s| !s.trim().is_empty())
            .cloned()
            .collect();
        println!("{:?}", words);
    }

    Ok(())
}
