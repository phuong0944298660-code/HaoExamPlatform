package com.jieliedu.platform.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 系统菜单实体
 */
@Data
@Entity
@Table(name = "sys_menu")
public class SysMenu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("menu_name")
    @Column(name = "menu_name", nullable = false)
    private String menuName;

    @JsonProperty("parent_id")
    @Column(name = "parent_id")
    private Long parentId = 0L;

    @JsonProperty("order_num")
    @Column(name = "order_num")
    private Integer orderNum = 0;

    @Column(name = "path")
    private String path;

    @Column(name = "component")
    private String component;

    @JsonProperty("is_frame")
    @Column(name = "is_frame")
    private Integer isFrame = 0;

    @JsonProperty("menu_type")
    @Column(name = "menu_type")
    private String menuType; // M目录 C菜单 F按钮

    @Column(name = "visible")
    private Integer visible = 1;

    @Column(name = "status")
    private Integer status = 1;

    @Column(name = "perms")
    private String perms;

    @Column(name = "icon")
    private String icon;

    @JsonProperty("create_time")
    @CreationTimestamp
    private LocalDateTime createTime;

    @JsonProperty("update_time")
    @UpdateTimestamp
    private LocalDateTime updateTime;

    @Column(name = "remark")
    private String remark;

    @Transient
    private java.util.List<SysMenu> children = new java.util.ArrayList<>();
}
