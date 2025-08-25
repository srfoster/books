# AWS and Remote Development

## 🛠️Try This - AWS Setup and Remote Development

**Time estimate.** 45 minutes.

**Overview.** This exercise is designed to help you set up a cloud computing environment using Amazon Web Services (AWS). You'll create an account, launch a free-tier EC2 instance, and connect to it remotely using VS Code.

**Justification.** While your personal computer is great for small models, some AI models require more computational power, memory, or specialized hardware (like GPUs) than most laptops can provide. Cloud computing gives you access to virtually unlimited resources on-demand. Additionally, developing in the cloud offers several advantages: your work is accessible from anywhere, you can collaborate more easily with others, you don't risk overheating your laptop during intensive computations, and you can experiment with different operating systems and configurations without affecting your main machine. Learning cloud development early will serve you well throughout your AI journey.

**Steps.**
1. Sign up for an AWS account at https://aws.amazon.com/ (requires a credit card, but we'll only use free tier resources)
2. Navigate to the EC2 service in the AWS Console
3. Launch a new instance:
   - Choose "Ubuntu Server 22.04 LTS" (free tier eligible)
   - Select "t2.micro" instance type (free tier)
   - Create a new key pair and download the .pem file (keep this safe!)
   - Configure security group to allow SSH access
4. Wait for the instance to launch and note its public IP address
5. Install the "Remote - SSH" extension in VS Code
6. Connect to your instance using VS Code:
   - Open Command Palette (Ctrl+Shift+P)
   - Select "Remote-SSH: Connect to Host"
   - Add new host: `ubuntu@YOUR_INSTANCE_IP`
   - Select your .pem key file when prompted
7. Once connected, install Python and pip on the remote instance:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip -y
   ```
8. Create a simple Python file on the remote instance and run it

**Deliverable.** A screenshot showing VS Code connected to your AWS instance (you should see the remote indicator in the bottom-left corner), plus a simple Python program running on the remote machine.

**Discussion.** How does it feel to be coding on a computer in the cloud? Think about the implications - you now have access to Amazon's data centers from your laptop. This is the same infrastructure that powers Netflix, Spotify, and countless other services. What possibilities does this open up for your AI projects? Consider the trade-offs: what do you gain and what do you lose by moving your development to the cloud?
