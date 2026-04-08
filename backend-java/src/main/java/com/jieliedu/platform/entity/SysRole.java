package com.jieliedu.platform.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 系统角色实体
 */
@Data
@Entity
@Table(name = "sys_role")
public class SysRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("role_name")
    @Column(name = "role_name", nullable = false)
    private String roleName;

    @JsonProperty("role_key")
    @Column(name = "role_key", nullable = false)
    private String roleKey;

    @JsonProperty("role_sort")
    @Column(name = "role_sort")
    private Integer roleSort = 0;

    @JsonProperty("data_scope")
    @Column(name = "data_scope")
    private String dataScope = "1";

    @Column(name = "status")
    private Integer status = 1;

    @Column(name = "remark")
    private String remark;

    @JsonProperty("create_time")
    @CreationTimestamp
    private LocalDateTime createTime;

    @JsonProperty("update_time")
    @UpdateTimestamp
    private LocalDateTime updateTime;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "sys_role_menu",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "menu_id")
    )
    private Set<SysMenu> menus = new HashSet<>();

    @Transient
    @JsonProperty("menu_ids")
    private java.util.List<Long> menuIds;
}
