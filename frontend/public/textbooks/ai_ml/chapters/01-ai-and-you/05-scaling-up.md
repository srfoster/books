# Scaling Up: Bigger Models, Bigger Hardware

## 🛠️Try This - Running a Larger Model

**Time estimate.** 30 minutes.

**Overview.** This exercise is designed to show you how to scale up your computational resources when you need more power. You'll temporarily upgrade your AWS instance to run a larger AI model, then scale back down to save costs.

**Justification.** Understanding how to scale computational resources up and down is crucial for practical AI development. Larger models often produce better results but require more memory and processing power. Being able to dynamically adjust your resources means you can run small experiments cheaply, then scale up only when needed for bigger tasks. This exercise also teaches you about the economic realities of AI - bigger models cost more to run, so you need to be strategic about when and how you use them.

**Steps.**
1. Connect to your AWS instance via VS Code (from the previous exercise)
2. Stop your current t2.micro instance:
   - Go to EC2 Console → Instances
   - Select your instance → Instance State → Stop
3. Change the instance type to something more powerful:
   - Right-click your stopped instance → Instance Settings → Change Instance Type
   - Select "t3.large" (2 vCPUs, 8 GB RAM) - Note: This will cost ~$0.10/hour
4. Start the instance again and reconnect via VS Code
5. Install the required libraries:
   ```bash
   pip3 install transformers torch accelerate
   ```
6. Run a larger text generation model:
   ```python
   from transformers import pipeline
   import time
   
   print("Loading larger model (this may take a few minutes)...")
   start_time = time.time()
   
   # Load a larger, more capable model
   generator = pipeline('text-generation', 
                       model='microsoft/DialoGPT-large',
                       device_map="auto")
   
   load_time = time.time() - start_time
   print(f"Model loaded in {load_time:.2f} seconds")
   
   # Generate text with the larger model
   prompt = "Explain quantum computing in simple terms:"
   result = generator(prompt, max_length=150, num_return_sequences=1)
   
   print(f"Prompt: {prompt}")
   print(f"Generated: {result[0]['generated_text']}")
   ```
7. Try a few different prompts and compare the quality to the smaller model
8. **Important**: Scale back down to save money:
   - Stop the instance
   - Change instance type back to "t2.micro"
   - Restart the instance

**Deliverable.** A screenshot showing the larger model running successfully on your upgraded instance, along with examples of text it generated. Include a brief comparison of the output quality compared to the smaller model from Exercise 3.

**Discussion.** What differences did you notice between the small and large models? Was the improved quality worth the additional computational cost? This trade-off between performance and cost is fundamental to practical AI deployment. How might you decide when to use a larger model versus a smaller one? Think about scenarios where the extra quality would be worth the cost, and scenarios where it wouldn't be.
