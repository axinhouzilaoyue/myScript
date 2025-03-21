#!/bin/bash

# 交换空间设置脚本
# 作者：Claude & Axin
# 日期：2025-03-21

# 默认参数
DEFAULT_SIZE="2G"
DEFAULT_LOCATION="/swapfile"

# 显示欢迎信息
echo "========================================="
echo "       Linux 交换空间设置脚本"
echo "========================================="
echo

# 询问交换空间大小
read -p "请输入交换空间大小 [默认: $DEFAULT_SIZE]: " swap_size
swap_size=${swap_size:-$DEFAULT_SIZE}

# 询问交换空间位置
read -p "请输入交换空间位置 [默认: $DEFAULT_LOCATION]: " swap_location
swap_location=${swap_location:-$DEFAULT_LOCATION}

# 确认用户输入
echo
echo "将使用以下参数创建交换空间："
echo "大小: $swap_size"
echo "位置: $swap_location"
read -p "是否继续? [Y/n]: " confirm
confirm=${confirm:-Y}

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

# 检查是否已存在交换文件
if [ -f "$swap_location" ]; then
    read -p "交换文件 $swap_location 已存在。是否覆盖? [y/N]: " overwrite
    overwrite=${overwrite:-N}
    
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "操作已取消"
        exit 0
    else
        # 如果文件已被用作交换空间，先关闭它
        sudo swapoff "$swap_location" 2>/dev/null
        # 删除现有文件
        sudo rm -f "$swap_location"
    fi
fi

echo
echo "正在创建交换空间，请稍候..."

# 创建交换文件
echo "- 创建大小为 $swap_size 的交换文件..."
sudo fallocate -l "$swap_size" "$swap_location"

# 设置安全权限
echo "- 设置文件权限..."
sudo chmod 600 "$swap_location"

# 设置为交换区
echo "- 设置为交换区..."
sudo mkswap "$swap_location"

# 激活交换区
echo "- 激活交换区..."
sudo swapon "$swap_location"

# 验证交换区已激活
echo "- 验证交换区状态..."
if swapon --show | grep -q "$swap_location"; then
    echo "交换空间已成功设置并激活!"
    
    # 显示当前的swappiness值
    swappiness=$(cat /proc/sys/vm/swappiness)
    echo "当前系统swappiness值: $swappiness"
    
    # 询问是否要添加到/etc/fstab以使其在重启后持久化
    read -p "是否将交换文件添加到/etc/fstab以使其在重启后自动激活? [y/N]: " add_to_fstab
    add_to_fstab=${add_to_fstab:-N}
    
    if [[ "$add_to_fstab" =~ ^[Yy]$ ]]; then
        # 检查fstab中是否已存在该条目
        if ! grep -q "$swap_location none swap" /etc/fstab; then
            echo "$swap_location none swap defaults 0 0" | sudo tee -a /etc/fstab > /dev/null
            echo "已添加到/etc/fstab"
        else
            echo "条目已存在于/etc/fstab中"
        fi
    fi
    
    # 显示系统交换空间信息
    echo
    echo "当前系统交换空间信息:"
    free -h | grep -i swap
else
    echo "交换空间设置失败，请检查日志查找错误"
fi

echo
echo "脚本执行完毕"
